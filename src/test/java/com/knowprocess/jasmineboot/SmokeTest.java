/*******************************************************************************
 *Copyright 2018 Tim Stephenson and contributors
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
package com.knowprocess.jasmineboot;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.fail;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

import javax.script.Bindings;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;

import org.junit.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public class SmokeTest {

    private static ScheduledExecutorService globalScheduledThreadPool = Executors.newScheduledThreadPool(20);

    private ObjectMapper objectMapper = new ObjectMapper();

    @Test
    public void testMinimalJasmineSpec() throws IOException {
        StringBuilder sb = createScript("classpath:specs/MinimalSpec.js");

        JsonNode report = runScript(sb);
        assertEquals(1, report.get("suite").get("totalSpecsDefined").asInt());
        assertNoFailedExpectations(report);
    }

    @Test
    public void testXhrSpec() throws IOException {
        StringBuilder sb = createScript("classpath:specs/XhrSpec.js");

        JsonNode report = runScript(sb);
        assertEquals(1, report.get("suite").get("totalSpecsDefined").asInt());
        assertNoFailedExpectations(report);
    }

    private void assertNoFailedExpectations(JsonNode report) {
        for (Iterator<JsonNode> it = report.get("results").elements() ; it.hasNext() ; ) {
            JsonNode result = (JsonNode) it.next();
            assertEquals("Spec failed: " + result.get("fullName").asText(),
                    0, result.get("failedExpectations").size());
        }
    }

    private JsonNode runScript(StringBuilder sb) throws IOException {
        ScriptEngine engine = getEngine();
        try {
            engine.eval(sb.toString());

            Bindings bindings = engine.getBindings(ScriptContext.ENGINE_SCOPE);
            String report = (String) bindings.get("report");
            return objectMapper.readTree(report);
        } catch (ScriptException e) {
            e.printStackTrace();
            fail();
            return null;
        }
    }

    private void loadPolyfills(StringBuilder sb) {
        sb.append("load(\"classpath:META-INF/resources/webjars/jasmine-boot/1.1.0/js/timer-polyfill.js\");\n");
        sb.append("load(\"classpath:META-INF/resources/webjars/jasmine-boot/1.1.0/js/xml-http-request-polyfill.js\");\n");
    }

    private StringBuilder createScript(String... scripts) {
        StringBuilder sb = new StringBuilder();
        sb.append("var window = this;\n");

        loadPolyfills(sb);
        loadJasmine(sb);
        sb.append(String.format("load(\"%1$s\");", "classpath:META-INF/resources/webjars/jasmine-boot/1.1.0/js/json-reporter.js"));

        for (String script : scripts) {
            sb.append(String.format("load(\"%1$s\");", script));
        }

        sb.append("jasmine.getEnv().execute();\n");

        return sb;
    }

    private void loadJasmine(final StringBuilder sb) {
        sb.append("load(\"classpath:META-INF/resources/webjars/jasmine/2.4.1/jasmine.js\");\n");
        sb.append("load(\"classpath:META-INF/resources/webjars/jasmine/2.4.1/jasmine-html.js\");\n");
        sb.append("function extend(destination, source) {\n");
        sb.append("for (var property in source) destination[property] = source[property];\n");
        sb.append("return destination;\n");
        sb.append("}\n");

        sb.append("window.jasmine = jasmineRequire.core(jasmineRequire);\n");
        sb.append("var jasmineInterface = jasmineRequire.interface(jasmine, jasmine.getEnv());\n");
        sb.append("extend(window, jasmineInterface);\n");
    }

    private ScriptEngine getEngine() {
        ScriptEngineManager factory = new ScriptEngineManager();
        ScriptEngine engine = factory.getEngineByName("nashorn");

        //Injection of __NASHORN_POLYFILL_TIMER__ in ScriptContext
        engine.getContext().setAttribute("__NASHORN_POLYFILL_TIMER__", globalScheduledThreadPool, ScriptContext.ENGINE_SCOPE);
        engine.getContext().setWriter(new PrintWriter(System.out));
        return engine;
    }
}
