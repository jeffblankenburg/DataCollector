/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');
// i18n strings for all supported locale
const Airtable = require("airtable");
const https = require("https");

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        const speakOutput = "Welcome to Data Collector!  Let's get started!  What is your current weight?";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .addDirective(getEntityDirective(sessionAttributes.datatypes, "Datatype"))
            .getResponse();
    }
};

const DataIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DataIntent';
    },
    handle(handlerInput) {
        var unitsSpoken = getSpokenWords(handlerInput, "units");
        var quantitySpoken = getSpokenWords(handlerInput, "quantity");
        var dataTypeSpoken = getSpokenWords(handlerInput, "datatype");

        const speakOutput = "Jeff, you just gave me data.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("This is the data intent")
            .getResponse();
    }
};

const DataTypeIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DataTypeIntent';
    },
    async handle(handlerInput) {
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var dataTypeSpoken = getSpokenWords(handlerInput, "datatypequery");

        var airtable = await new Airtable({apiKey: process.env.airtable_key}).base(process.env.airtable_base_data);
        await airtable("UserDatatype").create({"User": [sessionAttributes.recordId], "Datatype": dataTypeSpoken}, function(err, record) {if (err) {console.error(err);}});
        //sessionAttributes.datatypes.push
        //TODO: Need to get the new RecordID for the new datatype so that we can add it to the session array of datatypes.

        const speakOutput = "OK.  I've added the ability for you to track " + dataTypeSpoken + ". You can now start tracking your data. What would you like to do now?";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("What would you like to track now?")
            .addDirective(getEntityDirective(sessionAttributes.datatypes, "Datatype"))
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = "Jeff, you asked for help.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = "Goodbye";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = "Jeff, this is the fallback intent.";

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = "Intent reflextor message, Jeff. " + intentName;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    async handle(handlerInput, error) {
        const speakOutput = "Jeff, we encountered an error.";
        console.log(`~~~~ Error handled: ${JSON.stringify(error.stack)}`);

        var airtable = await new Airtable({apiKey: process.env.airtable_key}).base(process.env.airtable_base_error);
        await airtable("Error").create({"JSONRequest": JSON.stringify(handlerInput.requestEnvelope), "ErrorStack": JSON.stringify(error.stack)}, function(err, record) {if (err) {console.error(err);}});

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function getEntityDirective(data, valueName) {
    var entities = getDynamicEntities(data, valueName);
    console.log("ENTITIES = " + JSON.stringify(entities));

    let entityDirective = {
        type: "Dialog.UpdateDynamicEntities",
        updateBehavior: "REPLACE",
        types: [
        {
            name: "Datatype",
            values: entities
        }
        ]
    };

    return entityDirective;
}

function getDynamicEntities(data, valueName)
{
    console.log("DATA = " + JSON.stringify(data));
    if (data.records.length > 0) {
        var entities = [];
        for (i=0;i<data.records.length;i++) {
            entities.push({id: data.records[i].fields.RecordId ,name: {value: data.records[i].fields[valueName]}})
        }
        return entities;
    }
    else return [];
}

function getSpokenWords(handlerInput, slot) {
    if (handlerInput.requestEnvelope
        && handlerInput.requestEnvelope.request
        && handlerInput.requestEnvelope.request.intent
        && handlerInput.requestEnvelope.request.intent.slots
        && handlerInput.requestEnvelope.request.intent.slots[slot]
        && handlerInput.requestEnvelope.request.intent.slots[slot].value)
        return handlerInput.requestEnvelope.request.intent.slots[slot].value;
    else return undefined;
}

function getResolvedWords(handlerInput, slot) {
    if (handlerInput.requestEnvelope
        && handlerInput.requestEnvelope.request
        && handlerInput.requestEnvelope.request.intent
        && handlerInput.requestEnvelope.request.intent.slots
        && handlerInput.requestEnvelope.request.intent.slots[slot]
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0]
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0].values
        && handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0].values[0])
        return handlerInput.requestEnvelope.request.intent.slots[slot].resolutions.resolutionsPerAuthority[0].values
    else return undefined;
}

const RequestLog = {
    async process(handlerInput) {
        console.log("REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
        const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        var userRecord = await GetUserRecord(handlerInput.requestEnvelope.session.user.userId);
        console.log("USER RECORD = " + JSON.stringify(userRecord.fields));
        sessionAttributes.recordId = userRecord.fields.RecordId;
        await getUserData(handlerInput, sessionAttributes.recordId);
    }
};
  
const ResponseLog = {
    process(handlerInput) {
        console.log("RESPONSE BUILDER = " + JSON.stringify(handlerInput.responseBuilder.getResponse()));   
    }
};

async function getUserData(handlerInput, recordId) {
    console.log("RECORDID = " + JSON.stringify(recordId));
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    var filter = "&filterByFormula=%7BUser%7D%3D%22" + encodeURIComponent(recordId) + "%22";
    const userDatatypes = await httpGet(process.env.airtable_base_data, filter, "UserDatatype");
    console.log("USER DATATYPES = " + JSON.stringify(userDatatypes));
    sessionAttributes.datatypes = userDatatypes;
}

async function GetUserRecord(userId) {
    console.log("GETTING USER RECORD");
    var filter = "&filterByFormula=%7BUserId%7D%3D%22" + encodeURIComponent(userId) + "%22";
    const userRecord = await httpGet(process.env.airtable_base_data, filter, "User");
    //IF THERE ISN"T A USER RECORD, CREATE ONE.
    if (userRecord.records.length === 0){
        console.log("CREATING NEW USER RECORD");
        var airtable = new Airtable({apiKey: process.env.airtable_key}).base(process.env.airtable_base_data);
        return new Promise((resolve, reject) => {
            airtable("User").create({"UserId": userId}, 
                        function(err, record) {
                                console.log("NEW USER RECORD = " + JSON.stringify(record));
                                if (err) { console.error(err); return; }
                                resolve(record);
                            });
                        });
    }
    else{
        console.log("RETURNING FOUND USER RECORD = " + JSON.stringify(userRecord.records[0]));
        const result = await httpGet(process.env.airtable_base_data, "&filterByFormula=AND(RecordId%3D%22" + encodeURIComponent(userRecord.records[0].fields.RecordId) + "%22)", "User");
        return await result.records[0];
    }
}

function httpGet(base, filter, table = "Data"){
    //console.log("IN HTTP GET");
    //console.log("BASE = " + base);
    //console.log("FILTER = " + filter);
    
    var options = {
        host: "api.airtable.com",
        port: 443,
        path: "/v0/" + base + "/" + table + "?api_key=" + process.env.airtable_key + filter,
        method: "GET",
    };

    //console.log("FULL PATH = http://" + options.host + options.path);
    
    return new Promise(((resolve, reject) => {
      const request = https.request(options, (response) => {
        response.setEncoding("utf8");
        let returnData = "";

  
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`${response.statusCode}: ${response.req.getHeader("host")} ${response.req.path}`));
        }
        
        //console.log("HTTPS REQUEST OPTIONS = " + JSON.stringify(options));
  
        response.on("data", (chunk) => {
          returnData += chunk;
        });
  
        response.on("end", () => {
          resolve(JSON.parse(returnData));
        });
  
        response.on("error", (error) => {
          reject(error);
        });
      });
      request.end();
    }));
}
/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        DataIntentHandler,
        DataTypeIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(RequestLog)
    .addResponseInterceptors(ResponseLog)
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
