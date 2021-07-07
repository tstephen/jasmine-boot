/*******************************************************************************
 *Copyright 2015-2018 Tim Stephenson and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License.  You may obtain a copy
 * of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/
(function nashornEventLoopMain(context) {
  'use strict';

  var ArrayList = Java.type('java.util.ArrayList');
  var DataOutputStream = Java.type('java.io.DataOutputStream');
  var HttpURLConnection = Java.type('java.net.HttpURLConnection');
  var Scanner = Java.type('java.util.Scanner');
  var URL = Java.type('java.net.URL');

  var XMLHttpRequest = function () {
    var _method;
    var _url;
    var _async;
    var _usr;
    var _pwd;
    var _headers = {};
    var _responseHeaders = {};

    var me = this;

    this.onreadystatechange = function () {
    };

    this.onload = function () {
    };
    this.onerror = function () {};

    this.readyState = 0;
    this.response = null;
    this.responseText = null;
    this.responseType = '';
    this.status = null;
    this.statusText = null;
    this.timeout = 0; // no timeout by default
    this.ontimeout = function () {
    };
    this.withCredentials = false;
    var requestBuilder = null;

    this.abort = function () {

    };

    this.getAllResponseHeaders = function () {
      return _responseHeaders;
    };

    this.getResponseHeader = function (key) {
      return _responseHeaders[key];
    };

    this.setRequestHeader = function (key, value) {
      _headers[key] = value;
    };

    this.open = function (method, url, async, usr, pwd) {
      this.readyState = 1;

      _method = method;
      _url = url;

      _async = async === false ? false : true;

      _usr = usr || '';
      _pwd = pwd || '';

      context.setTimeout(this.onreadystatechange, 0);
    };

    this.send = function (data) {
      var url = new URL(_url);
      var connection;
      var scanner;
      try {
        connection = url.openConnection();
        connection.setRequestMethod(_method);

        this.setHeaders(connection, _headers);
        // TODO implement authorisation
        // setAuthorization(principal, connection);

        connection.setUseCaches(false);
        connection.setDoInput(true);
        connection.setDoOutput(true);

        console.log('  '+_method+' '+_url+(_usr != '' ? ' as "'+_usr+'"' : ''));
        this.sendData(connection, data);

        me.status = connection.getResponseCode();
        console.log('  status: '+this.status);
        switch (this.status) {
        case 201:
        case 204:
          // workaround for header map containing null key which throws
          // a NoSuchElementException that we don't seem to be able to catch
          // in JS-land
          console.log('  Any headers listed here will not be returned (except Location): '+connection.getHeaderFields());
          _responseHeaders['Location'] = connection.getHeaderField('Location');
          break;
        default:
          scanner = new Scanner(connection.getInputStream());
          me.responseText = scanner.useDelimiter("\\A").next();
          try {
            me.responseType = me.dataType = 'text';
            me.response = JSON.parse(me.responseText);
          } catch (e) {
            me.responseType = me.dataType = 'text';
          }

          for (var prop in connection.getHeaderFields()) {
            if (prop != undefined && prop != null && prop != 'null') {
              _responseHeaders[prop] = connection.getHeaderField(prop);
            }
          }
        }
        me.onload();
      } catch (e) {
        console.log('ERROR: '+e);
        if (this.status == 201 || this.status == 204) {
          console.log(' no content returned yet status was '+this.status);
          throw e;
        }
        // else no content should be expected
      } finally {
        try { scanner.close(); } catch(e) { ; }
        connection.disconnect();
      }
    }

    this.sendData = function(connection, data) {
      if (data != null) {
          //console.log("  Content-Length: "+data.toString().length);
          connection.setRequestProperty("Content-Length", ''+data.toString().length);
  //        for (Entry<String, List<String>> h : connection.getRequestProperties().entrySet()) {
  //            console.log(String.format("  %1$s: %2$s", h.getKey(),
  //                    h.getValue()));
  //        }
          // connection.setRequestProperty("Content-Language", "en-US");
          //console.log("==================== Data =======================");
          //console.log(data.toString());

          var wr = new DataOutputStream(
                  connection.getOutputStream());
          wr.writeBytes(data.toString());
          wr.flush();
          wr.close();
      }
    }

    this.setHeaders = function(connection) {
      for (var prop in _headers) {
        connection.setRequestProperty(prop, _headers[prop]);
      }
    }
  };

  context.XMLHttpRequest = XMLHttpRequest;
})(typeof global !== "undefined" && global || typeof self !== "undefined" && self || this);
