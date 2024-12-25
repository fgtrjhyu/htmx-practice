import fs from 'node:fs'
import { Hono } from 'hono'
import { createServer } from 'node:https'
import { serve } from '@hono/node-server'
import { html } from 'hono/html'

const app = new Hono()

var store =
{ Alice:
  { items:
    [
    ]
  }
, Bob:
  { items:
    [
    ]
  }
}

var forms =
{ Hoge:
  { init(item)
    { return { ...item, foo: [], bar: { text: "initial", checkbox: true } }
    }
  , update(item, body)
    { return { ...item, ...body }
    }
  , view(key, index, item, form, view)
    { return (
        html`
          <div>
            <div>
              <button hx-get="/api/htmx/keys/${key}/items/${index}?e=1" hx-target="#entity" hx-swap="innerHTML">Edit</button>
            </div>
            <div>Hoge view</div>
            <div>
              <label>text: <span>${item.text}</span></label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; border: 1px solid green">
              <div style="padding: 4px; margin: 4px; border: 1px solid blue;">
                <div>
                  <label>foo.length<span>${ item.foo.length }</span></label>
                  <div>
                    ${ item.foo.map(view || this.foo.view(key, index, 'Hoge', 'foo')) }
                  </div>
                  ${ item.foo.length < 3
                     ? html`<button hx-post="/api/htmx/keys/${key}/items/${index}/kinds/Hoge/props/foo" hx-target="#entity" hx-swap="innerHTML">add element</button>`
                     : html`<button disabled>add element</button>`
                  }
                </div>
              </div>
              <div style="padding: 4px; margin: 4px; border: 1px solid blue;">
                ${ this.bar.view(key, index, 'Hoge', 'bar')(item.bar) }
              </div>
            </div>
          </div>
        `
      )
    }
  , edit(key, index, item)
    { return (
        html`
          <div>
            <form hx-post="/api/htmx/keys/${key}/items/${index}" hx-target="#entity" hx-swap="innerHTML">
              <div>
                <button>Save</button>
              </div>
              <div>Hoge edit</div>
              <div>
                <label>text: <input name="text" value="${item.text}"></label>
              </div>
            </form>
            <div style="display: grid; grid-template-columns: 1fr 1fr; border: 1px solid green">
              <div style="padding: 4px; margin: 4px; border: 1px solid blue;">
                <div>
                  <label>foo.length<span>${ item.foo.length }</span></label>
                  <div>
                    ${ item.foo.map( (e, position) => this.foo.view(key, index, 'Hoge', 'foo', position, true)(e, position) ) }
                  </div>
                </div>
              </div>
              <div style="padding: 4px; margin: 4px; border: 1px solid blue;">
                ${ this.bar.view(key, index, 'Hoge', 'bar')(item.bar) }
              </div>
            </div>
          </div>
        `
      )
    }
  , foo:
    { init(oldValue, body)
      { const newEntry =
        { text: ""
        }
      ; return oldValue.concat( [ newEntry ] )
      }
    , update(oldValue, position, body)
      { const newElem = { ...oldValue[position], ...body };
      ; console.log(position, body)
      ; return oldValue.toSpliced(position, 1, newElem)
      }
    , delete(oldValue, position)
      { return oldValue.toSpliced(position, 1)
      }
    , view(key, index, kind, prop, position, edit) {
        return function(item, position)
        { console.log('view', key, index, kind, prop, position, 'edit', edit)
        ; if (edit) {
            return (
              html`
                <div>
                  <label>text: <span>${ item.text }</span></label>
                </div>
              `
            )
          } else {
            return (
              html`
                <div>
                  <button hx-delete="/api/htmx/keys/${key}/items/${index}/kinds/${kind}/props/${prop}/positions/${position}" hx-target="#entity" hx-swap="innerHTML">X</button>
                  <label>text: <span>${ item.text }</span></label>
                  <button hx-get="/api/htmx/keys/${key}/items/${index}/kinds/${kind}/props/${prop}/positions/${position}?e=1" hx-target="#entity" hx-swap="innerHTML">Edit</button>
                </div>
              `
            )
          }
        }
      }
    , edit(key, index, kind, prop, position) {
        return function(item, position)
        { return (
            html`
              <div>
                <form hx-post="/api/htmx/keys/${key}/items/${index}/kinds/${kind}/props/${prop}/positions/${position}" hx-target="#entity" hx-swap="innerHTML">
                  <label>text: <input name="text" value="${ item.text }"></label>
                  <button>submit</button>
                </form>
              </div>
            `
          )
        }
      }
    }
  , bar:
    { init(oldValue, body)
      { return oldValue
      }
    , update(oldValue, body)
      { return { ...oldValue, ...body } 
      }
    , view(key, index, kind, prop, position)
      { return function()
        { return (
          html`
            <div>bar edit</div>
          `
          )
        }
      }
    , edit(key, index, kind, prop, position)
      { return function()
        { return (
          html`
            <div></div>
          `
          )
        }
      }
    }
  }
, Fuga:
  { init(item)
    { return { ...item }
    }
  , update(item, body)
    { return { ...item, ...body }
    }
  , view(key, index, item)
    { return (
        html`
          <div>
            <div>
              <button hx-get="/api/htmx/keys/${key}/items/${index}?e=1" hx-target="#entity" hx-swap="innerHTML">Edit</button>
            </div>
            <div>Fuga view</div>
            <div>
              <label>text: <span>${item.text}</span></label>
            </div>
          </div>
        `
      );
    }
  , edit(key, index, item)
    { return (
        html`
          <div>
            <form hx-post="/api/htmx/keys/${key}/items/${index}" hx-target="#entity" hx-swap="innerHTML">
              <div>
                <button>Save</button>
              </div>
              <div>Fuga edit</div>
              <div>
                <label>text: <input name="text" value="${item.text}"></label>
              </div>
            </form>
          </div>
        `
      )
    }
  }
}

app.get('/favicon.ico', (c) =>
  { c.header('Content-Type', 'image/x-icon')
  ; return c.body(fs.readFileSync('src/favicon.ico'))
  }
);

function capitalize(text)
{ return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
}

function toAnchor(value, index)
{ return html`<button style="padding: 4px; margin: 4px;" hx-get="/api/htmx/keys/${value}" hx-target="#entity" hx-swap="innerHTML">${value}</buton>`
}

function showItem(selected, key)
{ return function(item, index)
  { const backgroundColor = (selected === index) ? 'blue' : 'inherit'
  ; const color = (selected === index) ? 'white' : 'inherit'
  ; return (
      html`
        <div hx-get="/api/htmx/keys/${key}/items/${index}" hx-target="#entity" hx-swap="innerHTML"
             style="border: 1px solid black; padding: 4px; margin: 4px; background-color: ${backgroundColor}; color: ${color}">
          <button hx-delete="/api/htmx/keys/${key}/items/${index}" hx-target="#entity" hx-swap="innerHTML">X</button>
          <span>${ index }.</span>
          <span>${ item.kind }</span>
        </div>
      `
    );
  }
}

function replaceProp(prop, obj, newValue)
{ return Object.fromEntries
  ( Object.entries(obj)
    .map( ([key, value], index) => key === prop ? [ key, newValue ] : [ key, value ] )
  )
}

app.post('/api/htmx/keys/:key/items/:index/kinds/:kind/props/:prop/positions/:position', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10)
  ; const kind = await c.req.param('kind')
  ; const prop = await c.req.param('prop')
  ; const position = await c.req.param('position')
  ; const body = await c.req.parseBody()
  ; const form = forms[kind]
  ; const oldEntry = store[key]
  ; const oldItems = oldEntry.items
  ; const oldItem = oldItems[index]
  ; const oldProp = oldItem[prop]
  ; const newProp = form[prop].update(oldProp, position, body)
  ; const item = replaceProp(prop, oldItem, newProp)
  ; const items = oldItems.toSpliced(index, 1, item)
  ; const entry = { ...oldEntry, items }
  ; store[key] = entry
  ; const view = form[prop].view(key, index, kind, prop, position)
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ form.view(key, index, item, form, view) }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.get('/api/htmx/keys/:key/items/:index/kinds/:kind/props/:prop/positions/:position', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10)
  ; const kind = await c.req.param('kind')
  ; const prop = await c.req.param('prop')
  ; const position = parseInt(await c.req.param('position'), 10)
  ; const form = forms[kind]
  ; const subForm = form[prop]
  ; const entry = store[key]
  ; const items = entry.items
  ; const item = items[index]
  ; console.log('get', key, 'index', index, 'items', items.length, typeof items)
  ; console.log('get', key, 'index', index, 'items[index]', items[index])
  ; const propValue = item[prop]

  ; const value = propValue[position]
  ; const edit = c.req.query('e')
  ; const view =
      function(elem, num) {
        if (num === position) {
          return form[prop].edit(key, index, kind, prop, position)(elem, position)
        } else {
          return form[prop].view(key, index, kind, prop, position, true)(elem, position)
        }
      }
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ form.view(key, index, item, form, view) }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.delete('/api/htmx/keys/:key/items/:index/kinds/:kind/props/:prop/positions/:position', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10)
  ; const kind = await c.req.param('kind')
  ; const prop = await c.req.param('prop')
  ; const position = await c.req.param('position')
  ; const form = forms[kind]
  ; const oldEntry = store[key]
  ; const oldItems = oldEntry.items
  ; const oldItem = oldItems[index]
  ; const oldProp = oldItem[prop]
  ; const newProp = form[prop].delete(oldProp, position)
  ; const item = replaceProp(prop, oldItem, newProp)
  ; const items = oldItems.toSpliced(index, 1, item)
  ; const entry = { ...oldEntry, items }
  ; store[key] = entry
  ; const view = form[prop].view(key, index, kind, prop, position)
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ form.view(key, index, item, form, view) }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.post('/api/htmx/keys/:key/items/:index/kinds/:kind/props/:prop', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10)
  ; const kind = await c.req.param('kind')
  ; const prop = await c.req.param('prop')
  ; const body = await c.req.parseBody()
  ; const form = forms[kind]
  ; const oldEntry = store[key]
  ; const oldItems = oldEntry.items
  ; const oldItem = oldItems[index]
  ; const oldProp = oldItem[prop]
  ; const newProp = form[prop].init(oldProp, body)
  ; console.log(newProp);
  ; const item = replaceProp(prop, oldItem, newProp)
  ; const items = oldItems.toSpliced(index, 1, item)
  ; const entry = { ...oldEntry, items }
  ; store[key] = entry
  ; const view = form[prop].view(key, index, kind, prop)
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ form.view(key, index, item, form, view) }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.post('/api/htmx/keys', async (c) =>
  { const body = await c.req.parseBody()
  ; const key = capitalize(body.key)
  ; const newEntry = [ key, { items: [] } ]
  ; store = Object.fromEntries( Object.entries(store).concat( [ newEntry ] ) )
  ; return c.html(html`${Object.keys(store).map(toAnchor)}`)
  }
);

app.post('/api/htmx/keys/:key/items/:index', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10)
  ; const body = await c.req.parseBody()
  ; console.log(body)
  ; const oldEntry = store[key]
  ; const oldItems = oldEntry.items
  ; const oldItem = oldItems[index]
  ; const form = forms[oldItem.kind];
  ; const item = form.update(oldItem, body)
  ; const items = oldItems.toSpliced(index, 1, item)
  ; const entry = { ...oldEntry, items }
  ; store[key] = entry;
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ form.view(key, index, item, form) }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.get('/api/htmx/keys/:key/items/:index', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10)
  ; const edit = c.req.query('e');
  ; const entry = store[key]
  ; const items = entry.items
  ; const item = items[index]
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                      ? html`<button >add</button>`
                      : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ item
                 ? ( edit
                     ? forms[item.kind].edit(key, index, item, forms[item.kind])
                     : forms[item.kind].view(key, index, item, forms[item.kind])
                   )
                 : null
               }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.delete('/api/htmx/keys/:key/items/:index', async (c) =>
  { const key = await c.req.param('key')
  ; const index = parseInt(await c.req.param('index'), 10);
  ; const oldEntry = store[key]
  ; const items = oldEntry.items.toSpliced(index, 1)
  ; console.log(key, index, items.length, oldEntry.items.length)
  ; const entry = { ...oldEntry, items }
  ; store[key] = entry
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
            </div>
          </div>
        </div>
      `
    )
  }
);

app.post('/api/htmx/keys/:key/items', async (c) =>
  { const key = await c.req.param('key')
  ; const body = await c.req.parseBody()
  ; const kind = body.kind;
  ; const form = forms[kind];
  ; const oldEntry = store[key]
  ; const index = oldEntry.items.length;
  ; const item = form.init({ kind  });
  ; const items = oldEntry.items.concat( [ item ] )
  ; const entry = { ...oldEntry, items }
  ; store[key] = entry
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(index, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              ${ form.view(key, index, item, form) }
            </div>
          </div>
        </div>
      `
    )
  }
);

app.get('/api/htmx/keys/:key', async (c) =>
  { const key = await c.req.param('key')
  ; const entry = store[key]
  ; const items = entry.items
  ; return c.html
    ( html`
        <div>
          <h1>${key}</h1>
          <div style="display: grid; grid-template-columns: 1fr 6fr;">
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
              <div id="items">${ items.map(showItem(undefined, key)) }</div>
              <div style="margin: 4px; padding: 4px;">
                <form hx-post="/api/htmx/keys/${key}/items" hx-target="#entity" hx-swap="innerHTML">
                  <select name="kind">
                    ${ Object.keys(forms).map(e => html`<option value="${e}">${e}</option>`) }
                  </select>
                  ${ (items.length) < 5 
                  ? html`<button >add</button>`
                  : html`<button disabled>add</button>`
                  }
                </form>
              </div>
            </div>
            <div style="border: 1px solid blue; padding: 4px; margin: 4px;">
            </div>
          </div>
        </div>
      `
    )
  }
);

app.get('/', (c) =>
  { return c.html
    ( html`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Htmx on Hono</title>
          <script
            src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.js"
            integrity="sha384-oeUn82QNXPuVkGCkcrInrS1twIxKhkZiFfr2TdiuObZ3n3yIeMiqcRzkIcguaof1"
            crossorigin="anonymous">
          </script>
        </head>
        <body>
          <div id="keys">
            ${ Object.keys(store).map(toAnchor) }
          </div>
          <form>
            <input name="key" minlength="3">
            <button hx-post="/api/htmx/keys" hx-target="#keys" hx-swap="innerHTML">add.</button>
          </form>
          <hr>
          <div id="entity"></div>
          <hr>
        </body>
      </html>
      `
    );
  }
);


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
