import { OpenAI } from "langchain/llms/openai";

import { PromptTemplate } from "langchain/prompts";

// import { ConsoleCallbackHandler } from 'langchain/callbacks';

import { StructuredOutputParser } from "langchain/output_parsers";

import { Schema } from "./schema";

const parser = StructuredOutputParser.fromZodSchema(Schema);

const formatInstructions = parser.getFormatInstructions();

console.log("formatInstructions", formatInstructions);

const baseInstructions = `Events should be labeled using object + past participle.
Start events should always be labeled with an indication of the trigger of the process.
End events should be labeled with the end state of the process.
Tasks should be labeled using object + verb.
X-OR Gateways should be labeled with a question.
The outgoing sequence flows should be labeled with the possible answers to these questions (conditions).
All other sequence flows should not be labeled.
Start events must have one outgoing sequence flow.
End events must have one incoming sequence flow.
All other activities must have at least one of each.
{format_instructions}`;

const createProcessPrompt = new PromptTemplate({
  template: `You are a BPMN expert that creates a BPMN process according to a description.
All BPMN processes you create must be valid, e.g., all elements must be connected.
If the description does not describe a process, reply with the word ERROR.
{base_instructions}
{format_instructions}
Description: {description}
Output:`,
  inputVariables: ["description"],
  partialVariables: {
    base_instructions: baseInstructions,
    format_instructions: formatInstructions,
  },
});

const updateProcessPrompt = new PromptTemplate({
  template: `You are a BPMN expert that updates a BPMN process according to the requested changes.
All BPMN processes you create must be valid, e.g., all elements must be connected.
If the requested changes are not related to the process, reply with the word ERROR.
{base_instructions}
{format_instructions}
Current BPMN process:
{process}
Requested changes: {requestedChanges}
Output:`,
  inputVariables: ["requestedChanges", "process"],
  partialVariables: {
    base_instructions: baseInstructions,
    format_instructions: formatInstructions,
  },
});

export class BpmnGPT {
  constructor() {
    this.model = new OpenAI({
      // callbacks: [new ConsoleCallbackHandler()],
      // modelName: 'text-curie-001',
      maxTokens: 2000,
      // openAIApiKey: process.env.OPENAI_API_KEY,
      openAIApiKey: "abc",

      temperature: 0.9,
      verbose: true,
    });
  }

  async createBpmn(description) {
    const prompt = await createProcessPrompt.format({ description });

    console.log("createProcessPrompt", prompt);

    const start = Date.now();
    let response;
    try {
      response = await this.model.call(prompt);
    } catch {
      response = `{
        "id": "immigration_process",
        "description": "Immigration services process flow",
        "elements": [
          {
            "id": "start_1",
            "name": "Application Received",
            "type": "bpmn:StartEvent"
          },
          {
            "id": "task_1",
            "name": "Documents Uploaded",
            "type": "bpmn:UserTask"
          },
          {
            "id": "task_2",
            "name": "Application Reviewed",
            "type": "bpmn:UserTask"
          },
          {
            "id": "gateway_1",
            "name": "Are Documents Complete?",
            "type": "bpmn:ExclusiveGateway"
          },
          {
            "id": "task_3",
            "name": "Request Additional Documents",
            "type": "bpmn:UserTask"
          },
          {
            "id": "task_4",
            "name": "Schedule Interview",
            "type": "bpmn:UserTask"
          },
          {
            "id": "task_5",
            "name": "Conduct Interview",
            "type": "bpmn:UserTask"
          },
          {
            "id": "task_6",
            "name": "Review Interview Results",
            "type": "bpmn:UserTask"
          },
          {
            "id": "gateway_2",
            "name": "Is Application Approved?",
            "type": "bpmn:ExclusiveGateway"
          },
          {
            "id": "task_7",
            "name": "Prepare Approval Documents",
            "type": "bpmn:UserTask"
          },
          {
            "id": "task_8",
            "name": "Send Approval Notification",
            "type": "bpmn:ServiceTask"
          },
          {
            "id": "task_9",
            "name": "Prepare Rejection Documents",
            "type": "bpmn:UserTask"
          },
          {
            "id": "task_10",
            "name": "Send Rejection Notification",
            "type": "bpmn:ServiceTask"
          },
          {
            "id": "end_1",
            "name": "Application Approved",
            "type": "bpmn:EndEvent"
          },
          {
            "id": "end_2",
            "name": "Application Rejected",
            "type": "bpmn:EndEvent"
          },
          {
            "id": "flow_1",
            "type": "bpmn:SequenceFlow",
            "source": "start_1",
            "target": "task_1"
          },
          {
            "id": "flow_2",
            "type": "bpmn:SequenceFlow",
            "source": "task_1",
            "target": "task_2"
          },
          {
            "id": "flow_3",
            "type": "bpmn:SequenceFlow",
            "source": "task_2",
            "target": "gateway_1"
          },
          {
            "id": "flow_4",
            "name": "Yes",
            "type": "bpmn:SequenceFlow",
            "source": "gateway_1",
            "target": "task_4"
          },
          {
            "id": "flow_5",
            "name": "No",
            "type": "bpmn:SequenceFlow",
            "source": "gateway_1",
            "target": "task_3"
          },
          {
            "id": "flow_6",
            "type": "bpmn:SequenceFlow",
            "source": "task_3",
            "target": "task_2"
          },
          {
            "id": "flow_7",
            "type": "bpmn:SequenceFlow",
            "source": "task_4",
            "target": "task_5"
          },
          {
            "id": "flow_8",
            "type": "bpmn:SequenceFlow",
            "source": "task_5",
            "target": "task_6"
          },
          {
            "id": "flow_9",
            "type": "bpmn:SequenceFlow",
            "source": "task_6",
            "target": "gateway_2"
          },
          {
            "id": "flow_10",
            "name": "Yes",
            "type": "bpmn:SequenceFlow",
            "source": "gateway_2",
            "target": "task_7"
          },
          {
            "id": "flow_11",
            "name": "No",
            "type": "bpmn:SequenceFlow",
            "source": "gateway_2",
            "target": "task_9"
          },
          {
            "id": "flow_12",
            "type": "bpmn:SequenceFlow",
            "source": "task_7",
            "target": "task_8"
          },
          {
            "id": "flow_13",
            "type": "bpmn:SequenceFlow",
            "source": "task_8",
            "target": "end_1"
          },
          {
            "id": "flow_14",
            "type": "bpmn:SequenceFlow",
            "source": "task_9",
            "target": "task_10"
          },
          {
            "id": "flow_15",
            "type": "bpmn:SequenceFlow",
            "source": "task_10",
            "target": "end_2"
          }
        ]
      }
            
      `;
    }
    console.log({ response });
    const end = Date.now();

    console.log("Time elapsed:", (end - start) / 1000, "seconds");

    console.log(response);

    if (response.trim() === "ERROR") {
      throw new Error("Could not create BPMN process");
    }

    return removeBackticks(response);
  }

  async updateBpmn(requestedChanges, process) {
    const prompt = await updateProcessPrompt.format({
      requestedChanges,
      process,
    });

    console.log("updateProcessPrompt", prompt);

    const response = await this.model.call(prompt);

    console.log(response);

    if (response.trim() === "ERROR") {
      throw new Error("Could not update BPMN process");
    }

    return removeBackticks(response);
  }
}

function removeBackticks(string) {
  return string.replace(/```json|```/g, "");
}
