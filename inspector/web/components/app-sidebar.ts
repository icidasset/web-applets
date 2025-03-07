import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './app-sidebar.css';
import { StorageData, store } from '../lib/store';
import { AppletAction } from '@web-applets/sdk';

@customElement('app-sidebar')
export class AppSidebar extends LitElement {
  renderRoot = this;

  @property({ type: Number })
  selected: number = 0;

  @property({ attribute: false })
  actions: AppletAction[] = [];

  @property({ type: String })
  schemaError: string = '';

  connectedCallback() {
    store.subscribe((data: StorageData) => {
      if (!data.applet) return;
      this.actions = data.applet.actions;
    });
    super.connectedCallback();
  }

  handleSelect(e: InputEvent) {
    const select = e.target as HTMLSelectElement;
    this.selected = select.selectedIndex;
  }

  handleSchemaChange(e: InputEvent) {
    const textarea = e.target as HTMLTextAreaElement;

    const trimmed = textarea.value.trim();

    if (!trimmed) {
      this.schemaError = '';
      textarea.setCustomValidity('');
      return;
    }
    try {
      const parsed = JSON.parse(trimmed);
      const formatted = JSON.stringify(parsed, null, 2);

      textarea.value = formatted;
      this.schemaError = '';
      textarea.setCustomValidity('');
    } catch (err) {
      this.schemaError = err.message;
      textarea.setCustomValidity('Invalid JSON');
    }
  }

  handleSchemaFocus(e: InputEvent) {
    const textarea = e.target as HTMLTextAreaElement;

    textarea.setCustomValidity('');
  }

  handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    console.log(formData.get('action-id'));
    const actionId = formData.get('action-id') as string;
    const params = formData.get('params') as string;
    window.applet.dispatchAction(actionId, JSON.parse(params));
  }

  render() {
    if (!this.actions.length) {
      return html`<p class="status-message">No actions available.</p>`;
    }

    const schema =
      JSON.stringify(this.actions[this.selected].parameters, null, 2) ?? 'None';

    return html`
      <form @submit=${this.handleSubmit.bind(this)}>
        <fieldset>
          <label>Action ID</label>
          <action-select
            .actions=${this.actions}
            name="action-id"
            @change=${this.handleSelect.bind(this)}
          ></action-select>
        </fieldset>
        <fieldset>
          <label>Schema</label>
          <pre class="schema">${schema}</pre>
        </fieldset>
        <fieldset>
          <label>Params</label>
          <textarea
            rows=${6}
            name="params"
            @focus=${this.handleSchemaFocus}
            @change=${this.handleSchemaChange.bind(this)}
          >
{}</textarea
          >
          ${this.schemaError
            ? html`<div class="error-message">${this.schemaError}</div>`
            : ''}
        </fieldset>
        <fieldset>
          <input type="submit" value="Dispatch action" />
        </fieldset>
      </form>
    `;
  }
}

@customElement('action-select')
export class ActionSelect extends LitElement {
  renderRoot = this;

  @property({ type: String })
  name: string;

  @property({ attribute: false })
  actions: AppletAction[] = [];

  render() {
    return html`
      <select name=${this.name}>
        ${this.actions.map((action) => {
          return html`<option id="action">${action.id}</option>`;
        })}
      </select>
    `;
  }
}
