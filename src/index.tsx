import fs from 'node:fs'
import { Hono } from 'hono'
import { createServer } from 'node:https'
import { serve } from '@hono/node-server'
import { html } from 'hono/html'

const app = new Hono()

let state = 1

app.post('/htmx/foo', async (c) => {
  const body = await c.req.parseBody()
  state = parseInt(body.value, 10)
  return c.html(
    html`
      <script>
        // Event broadcasting 
        for(const elem of Array.from(document.querySelectorAll('.myEventTarget'))) {
          htmx.trigger(elem, 'myEvent', { value: ${state}, other: ${state} * 2 })
        }
      </script>
      <div${state}</div>
    `
  )
});

function inputElement(name) {
  return function(value, index) {
    return html`<input name="${name}" value="${value}">`
  }
}

app.get('/htmx/bar', async (c) => {
  const body = await c.req.parseBody()
  const queries = await c.req.queries()
  const foo = queries['foo']
  const bar = queries['bar']
  console.log('bar/get', 'queries', queries, 'body', body)
  console.log('bar/get/foo', foo, typeof foo, foo instanceof Array)
  console.log('bar/get/bar', bar, typeof bar, bar instanceof Array)
  return c.html(
    html`
      ${ foo.map(inputElement('foo')) }
      <div style="border: 1px solid blue; padding: 8px; margin: 8px; width: 10em; background-color: green; color: white;">
        ${ [...new Array(state).keys()].map( e => html`<span style="padding: 2px; margin: 2px;">${e}</span>` ) }
      </div>
    `
  )
});

app.post('/htmx/baz', async (c) => {
  const body = await c.req.parseBody()
  const queries = await c.req.queries()
  console.log('baz/post', 'queries', queries, 'body', body)
  return c.html(
    html`
      <div style="border: 1px solid blue; padding: 8px; margin: 8px; width: 10em; background-color: blue; color: white;">
        ${ new Array(state).fill('*').map( e => html`<span style="padding: 2px; margin: 2px;">${e}</span>` ) }
      </div>
    `
  )
});

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/x-icon');
  return c.body(fs.readFileSync('src/favicon.ico'))
});

app.get('/', (c) => {
  return c.html(
    html`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Htmx on Hono</title>
          <script
            src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.js"
            integrity="sha384-oeUn82QNXPuVkGCkcrInrS1twIxKhkZiFfr2TdiuObZ3n3yIeMiqcRzkIcguaof1"
            crossorigin="anonymous">
          </script>
          <script>
          const person = {
            firstName: "Jone",
            lastName: "Doe",
          };
          </script>
        </head>
        <body>

          <div style="border: 1px solid green; padding: 4px; margin: 4px;">
            <form hx-post="/htmx/foo" hx-target="#foo" hx-swap="innerHTML">
              <input name="value" type="number" value="5" min="1" max="10">
              <button>Click me!</button>
            </form>
            <div id="foo"></div>
          </div>

          <hr>
          <h1>trigger 1</h1>
          <form name="t1" hx-get="/htmx/bar" hx-trigger="myEvent" hx-vals="js:{ 'bar': [ document.forms.t1.bar.checked ] }" hx-swap="innerHTML" class="myEventTarget">
            <input name="foo" value="something-1">
            <input name="foo" value="something-2">
            <input name="bar" type="checkbox">
          </form>
          
          <hr>
          <h1>trigger 2</h1>
          <form name"form1" hx-post="/htmx/baz" hx-trigger="myEvent" hx-swap="innerHTML" class="myEventTarget">
            <input name="foo" value="foo-value"><!-- do not include -->
            <input name="bar" value="bar-value">
            <input name="baz" value="baz-value"><!-- do not include -->
            <input name="qux" value="qux-value">
          </form>

          <hr>
          <h1>trigger 3</h1>
          <form hx-post="/htmx/baz" hx-trigger="myEvent" hx-swap="innerHTML" class="myEventTarget">
            <input name="foo" value="foo-value">
            <input name="bar" value="bar-value"><!-- do not include but the y parameter is this.value why the hx-vals evaluate this value by the expressions -->
            <input name="baz" value="baz-value">
            <input name="qux" value="qux-value">
          </form>
        </body>
      </html>
    `
  );
});


const port = 3000;
//const options =
//{ port: port
//, fetch: app.fetch
//, createServer: createServer
//, serverOptions:
//  { key: fs.readFileSync('./cert/localhost-key.pem')
//  , cert: fs.readFileSync('./cert/localhost.pem')
//  }
//};
const options =
{ port: port
, fetch: app.fetch
};

console.log(`Server is running on http://localhost:${port}`)
serve(options)
