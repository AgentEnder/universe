import { RemoteEventDetails, RemoteEventType, RemoteLogLevel } from "../types/remote-events";
import { LogPrefix } from "../utilities/constants";

/** Logging extension which simply standardizes the console format */
export const logEvent = (logLevel: RemoteLogLevel, message: string, error?: Error) => {
    switch (logLevel) {
        case RemoteLogLevel.Information:
            console.info(`${LogPrefix} ${message}`);
            break;
        case RemoteLogLevel.Warning:
            console.warn(`${LogPrefix} ${message}`);
            break;
        case RemoteLogLevel.Error:
            console.error(`${LogPrefix} ${message}`, error);
            break;
        default:
            console.info(`${LogPrefix} ${message}`);
    }
};

/** Logging extension for info messages to console */
export const logInformation = (message: string) => {
    console.info(`${LogPrefix} ${message}`);
}

/** Logging extension for warning messages to console */
export const logWarning = (message: string) => {
    console.warn(`${LogPrefix} ${message}`);
}

/** Logging extension for error messages to console */
export const logError = (message: string, error: Error) => {
    console.error(`${LogPrefix} ${message}`, error);
}

/** Window event extension which simply standardizes the format and structure */
export const emitEvent = (eventType: RemoteEventType, details: RemoteEventDetails) => {
    window.dispatchEvent(new CustomEvent(`${LogPrefix} Event: ${eventType}`, details));
};
