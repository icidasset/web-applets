import {
  AppletMessage,
  ActionParams,
  AppletDataMessage,
  AppletMessageChannel,
  AppletDataEvent,
  AppletLoadEvent,
  AppletReadyEvent,
  JSONSchemaProperties,
} from './shared';

export type ActionHandler<T extends ActionParams> = (
  params: T
) => void | Promise<void>;

export type ActionHandlerDict = { [key: string]: ActionHandler<any> };

export class AppletContext extends AppletMessageChannel {
  actionHandlers: ActionHandlerDict = {};
  view: HTMLElement;
  #data: any;

  connect() {
    // When document loads/if it's loaded, call the initialize function
    if (
      document.readyState === 'complete' ||
      document.readyState === 'interactive'
    ) {
      // Document has loaded already.
      // Timeout added so if the caller defines the onload function, it will exist by now
      setTimeout(this.initialize, 1);
    } else {
      // Document not yet loaded, we'll add an event listener to call when it does
      window.addEventListener('DOMContentLoaded', this.initialize);
    }

    this.createResizeObserver();
    this.attachEventListeners();
    this.view = document.querySelector('body');

    return this;
  }

  async initialize() {
    // Call the onload function
    const loadEvent = new AppletLoadEvent();
    this.dispatchEvent(loadEvent);
    await this.onload(loadEvent);

    // Tell the client we're ready
    this.send(new AppletMessage('ready'));

    // Emit a local ready event
    const readyEvent = new AppletReadyEvent();
    this.dispatchEvent(readyEvent);
    await this.onload(readyEvent);
  }

  createResizeObserver() {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const message = new AppletMessage('resize', {
          dimensions: {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          },
        });
        this.send(message);
      }
    });
    resizeObserver.observe(document.querySelector('html')!);
  }

  attachEventListeners() {
    this.on('data', (message: AppletDataMessage) => {
      this.setData(message.data);
    });

    this.on('action', async (message: AppletMessage) => {
      if (Object.keys(this.actionHandlers).includes(message.actionId)) {
        await this.actionHandlers[message.actionId](message.params);
      }
    });
  }

  setActionHandler<T = ActionParams>(
    actionId: string,
    handler: ActionHandler<T>
  ) {
    this.actionHandlers[actionId] = handler;
  }

  defineAction<T = ActionParams>(
    actionId: string,
    { handler }: ActionDefinition<T>
  ) {}

  set data(data: any) {
    this.setData(data);
  }

  get data() {
    return this.#data;
  }

  async setData(data: any) {
    const dataMessage = new AppletMessage('data', { data });
    await this.send(dataMessage);
    this.#data = data;

    const dataEvent = new AppletDataEvent({ data });
    this.dispatchEvent(dataEvent);
    this.ondata(dataEvent);
  }

  onload(event: AppletLoadEvent): Promise<void> | void {}
  onready(event: AppletReadyEvent): void {}
  ondata(event: AppletDataEvent): void {}
}

interface ActionDefinition<T> {
  params?: JSONSchemaProperties;
  handler: ActionHandler<T>;
}

export const appletContext = new AppletContext();
