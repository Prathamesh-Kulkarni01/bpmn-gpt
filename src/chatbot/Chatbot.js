import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import { render } from 'react-dom';

import { Button, Heading, InlineLoading, TextInput } from '@carbon/react';

import { ChatBot, Close, SendAlt, UserAvatar } from '@carbon/icons-react';

import classnames from 'classnames';

import { BpmnGPT } from './langchain';

import dummyResponse from './dummy-response.txt';

import { fromJson } from './generator';

const useDummyResponse = false;

export default class ChatbotUi {
  constructor(bpmnjs, canvas) {
    const container = document.createElement('div');

    container.id = 'chatbot-container';

    canvas.getContainer().appendChild(container);

    const bpmnGPT = new BpmnGPT();

    render(<App bpmnGPT={ bpmnGPT } bpmnjs={ bpmnjs } />, container);
  }
}

ChatbotUi.$inject = [ 'bpmnjs', 'canvas' ];

function App({ bpmnGPT, bpmnjs }) {
  const [ messages, addMessage ] = useReducer(
    (state, message) => {
      return [ ...state, message ];
    },
    [
      {
        type: 'ai',
        text: "Let's start by describing the process you want to create.",
      },
    ]
  );

  const [ open, setOpen ] = useState(true);
  const [ prompting, setPrompting ] = useState(false);
  const [ value, setValue ] = useState('');
  const [ lastResponse, setLastResponse ] = useState(null);

  const submitPrompt = useCallback(async () => {
    const prompt = value.trim();

    addMessage({ type: 'human', text: prompt });

    setValue('');

    setPrompting(true);

    try {
      let response;

      if (lastResponse) {

        // update
        response = await (useDummyResponse ? dummyPrompt() : bpmnGPT.updateBpmn(prompt, lastResponse));
      } else {

        // create
        response = await (useDummyResponse ? dummyPrompt() : bpmnGPT.createBpmn(prompt));
      }

      setLastResponse(response);

      const json = JSON.parse(response);

      console.log('json', json);

      addMessage({
        type: 'ai',
        text: lastResponse
          ? 'I updated the process according to the changes you requested.'
          : 'I created the process according to your description.',
      });

      const xml = await fromJson(json, bpmnjs);

      console.log('xml after layout', xml);

      await bpmnjs.importXML(xml);

      console.log('imported', bpmnjs.get('elementRegistry')._elements);

      bpmnjs.get('canvas').zoom('fit-viewport');
    } catch (error) {
      console.log('error', error);

      addMessage({ type: 'ai', text: `Error: ${error.message}` });
    } finally {
      setPrompting(false);
    }
  }, [ addMessage, lastResponse, value ]);

  const onToggle = useCallback(() => {
    setOpen(!open);
  }, [ open ]);

  const onInput = useCallback(
    ({ target }) => {
      setValue(target.value);
    },
    [ setValue ]
  );

  const onKeyDown = useCallback(
    ({ code }) => {
      if (code === 'Enter' && value.length && !prompting) {
        submitPrompt();
      }
    },
    [ prompting, submitPrompt, value ]
  );

  const onSubmit = useCallback(() => {
    if (value.length && !prompting) {
      submitPrompt();
    }
  }, [ prompting, submitPrompt, value ]);

  const ref = useRef();

  useEffect(() => {
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [ messages ]);

  return (
    <div style={{border:'1px solid grey',borderRadius:'4px',overflow:'hidden'}}>
      {open ? (
        <div className="chatbot djs-scrollable">
          <div className="chatbot-header">
            <Heading>Axelor AI by Harry Watson</Heading>
            <button style={{border:'none',background:'transparent'}} hasIconOnly onClick={ onToggle } kind="ghost" label="Close">
              <Close />
            </button>
          </div>
          <div ref={ ref } className="chatbot-messages" style={{backgroundColor:`rgba(0,0,0,0.1)`}}>
            {messages.map((message, index) => (
              <Message key={ index } type={ message.type }>
                {message.text}
              </Message>
            ))}
            {prompting && (
              <Message type="ai">
                <InlineLoading />
              </Message>
            )}
          </div>
          <div className="chatbot-input" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <input
              id="chatbot-input"
              labelText="Describe the process..."
              hideLabel={ true }
              placeholder="Describe the process..."
              onInput={ onInput }
              onKeyDown={ onKeyDown }
              value={value }
            />
            <Button
              style={{ backgroundColor: 'transparent', border:'none'}}
              hasIconOnly
              disabled={ prompting || !value.length }
              onClick={ onSubmit }
              label="Submit"
            >
              <SendAlt />
            </Button>
          </div>
        </div>
      ) : (
        <Button hasIconOnly onClick={ onToggle } label="Open">
          <ChatBot />
        </Button>
      )}
    </div>
  );
}

function Message(props) {
  const { children, type } = props;

  return (
    <div
      className={ classnames('chatbot-message', {
        'chatbot-message-ai': type === 'ai',
        'chatbot-message-human': type === 'human',
      }) }
    >
      <div className="chatbot-message-avatar">
        {type === 'ai' ? <ChatBot /> : <UserAvatar />}
      </div>
      <div className="chatbot-message-bubble">{children}</div>
    </div>
  );
}

async function dummyPrompt(prompt, delay = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(dummyResponse);
    }, delay);
  });
}
