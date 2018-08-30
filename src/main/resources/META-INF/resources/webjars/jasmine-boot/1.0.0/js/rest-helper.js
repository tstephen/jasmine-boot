/*******************************************************************************
 * Copyright 2018 Tim Stephenson and contributors
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License.  You may obtain a copy
 *  of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations under
 *  the License.
 ******************************************************************************/

/*
 * Make search params available as array
 */
function getSearchParameters() {
  var prmstr = (window['location'] == undefined ? '' : window.location.search.substr(1));
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
  var params = {};
  var prmarr = prmstr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
      var tmparr = prmarr[i].split("=");
      params[tmparr[0]] = tmparr[1];
  }
  return params;
}

/**
 * Non-visual API wrapper.
 */
function RestEntityHelper(userOptions) {
  var me = {
    options: {
      auth: window['$auth'] == undefined ? undefined : $auth.showLogin,
      server: window['$env'] == undefined ? 'http://localhost:8080' : $env.server,
      tenantId: 'knowprocess',
      token: getSearchParameters()['t'] == null ? null : getSearchParameters()['t']
    }
  };
  for (key in userOptions) {
    me.options[key] = userOptions[key];
  }

  // partial implementation of jQuery ajax method as cannot load full jQuery in Nashorn
  me.ajax = function(options) {
    try {
      var xhr = new XMLHttpRequest();
      var method = options['type'] == undefined ? 'GET' : options['type'];
      var url = options['url'].indexOf('http')==0 ? options['url'] : me.options.server+options['url'];
      // console.log('  '+method+' '+url);
      xhr.open(method, url);
      xhr.onload = function() {
        if (xhr.status == 401 && me.options['auth'] != undefined) me.options.auth();
        try {
          if (options['success']!=undefined && typeof options['success'] == 'function') {
            switch (options['contentType']) {
            case 'application/xml':
              options['success'](xhr.responseXML, xhr.status, xhr);
              break;
            case 'text/html':
            case 'text/plain':
              options['success'](xhr.responseText, xhr.status, xhr);
              break;
            default:
              try {
                xhr.response = JSON.parse(xhr.responseText);
                options['success'](xhr.response, xhr.status, xhr);
                //console.log('  able to parse response to JSON');
              } catch (e) {
                console.log('Unable to parse JSON from response, send text');
                options['success'](xhr.responseText, xhr.status, xhr);
              }
            }
          }
          if (options['complete']!=undefined && typeof options['complete'] == 'function') {
            options['complete'](xhr.response, xhr.status, xhr);
          }
        } catch (e) {
          console.log('ERROR during onload '+e);
          throw e;
        }
      };
      xhr.onerror = function() {
        console.log('ERROR: onerror ')
        if (options['error']!=undefined && typeof options['error'] == 'function') {
          options['error'](xhr, xhr.statusText);
        }
      }
      xhr.setRequestHeader('Content-Type', options['contentType'] == undefined ? 'application/x-www-form-urlencoded; charset=UTF-8' : options['contentType']);
      if (me.options['token'] != undefined) {
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-Authorization', 'Bearer '+me.options['token']);
        xhr.setRequestHeader('Cache-Control', 'no-cache');
      } 
      if (options['data']==undefined) {
        xhr.send();
      } else {
        xhr.send(options['data']);
      }
    } catch (e) {
      console.log('ERROR: '+e);
    }
  }

  me.getJSON = function(url, done) {
//    me.ajax({ contentType: 'application/json', type: 'GET', url: url, success: done });
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url.indexOf('http')==0 ? url : me.options.server+url);
    xhr.onload = function() {
      if (xhr.status == 401 && me.options['auth'] != undefined) me.options.auth();
      done(JSON.parse(xhr.responseText), xhr.status, xhr);
    };
    xhr.onerror = function() {
      console.log('ERROR: onerror ')
      if (options['error']!=undefined && typeof options['error'] == 'function') {
        options['error'](xhr, xhr.statusText);
      }
      if (xhr.status == 401 && options['auth'] != undefined) options.auth();
    };
    if (me.options['token'] != undefined) {
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('X-Authorization', 'Bearer '+me.options['token']);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
    }
    xhr.send();
  }

  me.localId = function(uriOrObj) {
    if (uriOrObj == undefined) return;
    else if (typeof uriOrObj == 'object') return me.localId(me.uri(uriOrObj));
    else return uriOrObj.substring(uriOrObj.lastIndexOf('/')+1);
  }

  me.tenantUri = function(entity, entityPath) {
    //console.log('tenantUri: '+JSON.stringify(entity));
    var uri = me.uri(entity);
//    if (entityPath===undefined) entityPath = ractive.get('entityPath');
    if (uri != undefined && uri.indexOf(me.options.tenantId)==-1) {
//      uri = uri.replace(entityPath,'/'+ractive.get('tenant.id')+entityPath);
      var pathStart = uri.indexOf('/',7);
      uri = uri.substring(0, pathStart)+'/'+me.options.tenantId+uri.substring(pathStart);
    }
    return uri;
  }

  me.uri = function(entity, entityPath) {
    //console.log('uri: '+entity);
    var uri;
    try {
      if (entity['links']!=undefined) {
        entity.links.forEach(function(d) {
          if (d.rel == 'self') {
            uri = d.href;
          }
        });
      } else if (entity['_links']!=undefined) {
        uri = entity._links.self.href;
      } else {
        console.error('Entity is not HAL compliant: '
            +JSON.stringify(entity)+'. '+e);
      }
//      // work around for sub-dir running
//      if (uri != undefined && uri.indexOf(ractive.getServer())==-1 && uri.indexOf('//')!=-1) {
//        uri = ractive.getServer() + uri.substring(uri.indexOf('/', uri.indexOf('//')+2));
//      } else if (uri != undefined && uri.indexOf('//')==-1) {
//        uri = ractive.getServer()+uri;
//      }
    } catch (e) {
      console.error('Cannot get URI of '+JSON.stringify(entity)+'. '+e);
    }
    return uri;
  }

  return me;
};
