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
describe("XHR polyfill", function() {

  it("checks the index page", function(done) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://github.com/tstephen/jasmine-boot');
    xhr.onload = function() {
      if (xhr.status === 200) {
        expect(xhr.responseText).toContain('</html>');
      } else {
        console.log('ERROR: Request failed.  Returned status of ' + xhr.status);
      }
      done();
    };
    xhr.send();
  });

});
