/**
 * Creates a custom menu in the Google Spreadsheet UI when the spreadsheet is opened.
 */
function onOpen() {
  let ui = SpreadsheetApp.getUi();
    let subMenu_1 = ui.createMenu('SETTINGS')
      .addItem(`Set Pre-Defined Info`,'showSettingListsModal')
      .addSeparator()
      .addItem(`Reset All Pre-Defined Info & Triggers`,`resetScriptPropertiesAndTriggers`)      

    let subMenu_2 = ui.createMenu('TASK SHEETS')
      .addItem('Create a New Task Sheet', 'createNewSheetModal')
      .addSeparator()
      .addItem('Modify Editors of the Current Sheet', 'modifyEditorsModal');

    let subMenu_3 = ui.createMenu('TEST')
      .addItem(`Send General Today's Reminder`,'runGeneralReminderToday')
      .addSeparator()
      .addItem(`Send General Next Week's Reminder`, 'runGeneralReminderWeek')
      .addSeparator()
      .addItem(`Send Staff-Based Today's Reminder`,'runStaffBasedReminderToday')
      .addSeparator()
      .addItem(`Send Staff-Based Next Week's Reminder`,'runStaffBasedReminderWeek')
      .addSeparator()
      .addItem(`Update Completion Status`,'updateCompletionStatusToSheet')

    let subMenu_4 = ui.createMenu('BEFORE FIRST USE')
      .addItem(`Conduct Authorization`,'showAuthorization')
      .addSeparator()
      .addItem('Return to Original Format', 'returnToOriginalFormat');
    
    ui.createMenu('Custom Menu')
        .addSubMenu(subMenu_1)
        .addSeparator()
        .addItem(`Update Index Sheets and Sort Task Sheets`,'updateAllTaskIndexSheets')
        .addSeparator()
        .addSubMenu(subMenu_2)
        .addSeparator()
        .addSubMenu(subMenu_3)
        .addSeparator()
        .addSubMenu(subMenu_4)
        .addToUi();
}

/**
 * Requests necessary authorizations for the script to access Google Services like SpreadsheetApp, DriveApp, etc.
 */
function showAuthorization(){
  SpreadsheetApp;
  DriveApp;
  GmailApp;
  DocumentApp;
}

/**
 * Resets the Google Spreadsheet to its original format.
 * This function first creates a new sheet and sets it as the first sheet in the spreadsheet.
 * Then, it iterates through all existing sheets and deletes them, except for the newly created sheet.
 * Finally, it resets script properties and triggers related to the spreadsheet.
 * A message box is displayed upon completion to confirm the actions taken.
 *
 * @example
 * // To use this function, simply call it without any parameters.
 * returnToOriginalFormat();
 */
function returnToOriginalFormat() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Create a new sheet first
  let newSheet = spreadsheet.insertSheet("New Sheet"); // Replace "New Sheet" with your desired sheet name
  
  // Move the new sheet to the first position
  newSheet.activate();
  spreadsheet.moveActiveSheet(1);

  // Get all sheets including the new sheet
  let allSheets = spreadsheet.getSheets();
  
  // Delete all sheets except the new sheet
  for (let i = 1; i < allSheets.length; i++) { // Start from the second sheet
    spreadsheet.deleteSheet(allSheets[i]);
  }

  resetScriptPropertiesAndTriggers();

  // Display a message box after completion
  Browser.msgBox("Return to the original format (All sheets except 'New Sheet' deleted/ Pre-defined information reset/ Pre-set triggers deleted).");
}

/**
 * Displays a modal dialog with a list of settings for the user to configure.
 */
function showSettingListsModal() {
    // Create a template from the HTML file
    let htmlTemplate = HtmlService.createTemplateFromFile('show-setting-lists');
    let scriptProperties = PropertiesService.getScriptProperties();

    //Index Sheet
    htmlTemplate.isIndexSheetPropertyKey = scriptProperties.getProperty(SCRIPT_PROPERTY_INDEX_SHEET) !== null ? "SCRIPT_PROPERTY_INDEX_SHEET" : null;

    //Staff of this Spreadsheet
    htmlTemplate.isStaffPropertyKey = scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_STAFF) !== null ? "SCRIPT_PROPERTY_KEY_STAFF" : null;

    //General Reminder
    htmlTemplate.isGeneralReminderEmailPropertyKey = scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_GENERAL_REMINDER_EMAILS) !== null ? "SCRIPT_PROPERTY_KEY_GENERAL_REMINDER_EMAILS" : null;
    htmlTemplate.isGeneralReminderDocURLPropertyKey = scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_GENERAL_REM_DOC_URL) !== null ? "SCRIPT_PROPERTY_KEY_GENERAL_REM_DOC_URL" : null;

    //Staff-Based Reminder
    htmlTemplate.isDesignatedStaffPropertyKey = scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_DESIG_STAFF) !== null ? "SCRIPT_PROPERTY_KEY_DESIG_STAFF" : null;
    htmlTemplate.isStaffBasedReminderDocURLPropertyKey = scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_STAFFBASED_REM_DATA) !== null ? "SCRIPT_PROPERTY_KEY_STAFFBASED_REM_DATA" : null;
    
    // Check the status of each trigger
    htmlTemplate.isGeneralReminderTodaySet = isTriggerAlreadySet_('runGeneralReminderToday');
    htmlTemplate.isGeneralReminderWeekSet = isTriggerAlreadySet_('runGeneralReminderWeek');
    htmlTemplate.isStaffReminderTodaySet = isTriggerAlreadySet_('runStaffBasedReminderToday');
    htmlTemplate.isStaffReminderWeekSet = isTriggerAlreadySet_('runStaffBasedReminderWeek');
    htmlTemplate.isUpdateCompletionStatusToSheet = isTriggerAlreadySet_('updateCompletionStatusToSheet');
    
    let html = htmlTemplate
        .evaluate()
        .setWidth(850)
        .setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(html, 'Lists of Settings');
}

/**
 * Determines the next action based on the success or failure of the previous operation.
 * @param {string} description - Description of the operation result.
 * @param {string} type - Indicates whether the operation was a 'success' or 'failure'.
 */
function selectNextAction(description,type){
  if(type === "success"){
    let nextStep = Browser.msgBox(`${description} Do you want to proceed with another setting?`,Browser.Buttons.YES_NO);
    if(nextStep === 'yes'){
      showSettingListsModal();
    }
  } else if (type === "failure") {
    let nextStep = Browser.msgBox(`${description} Please try the setting again.`,Browser.Buttons.OK);
    if(nextStep === 'ok'){
      showSettingListsModal();
    }
  }

}

/**
 * Displays a modal for setting index sheet information.
 */
function showIndexSheetInfoModal() {
  let indexSheetInfoString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_INDEX_SHEET);
  let indexSheetInfo = JSON.parse(indexSheetInfoString || '{}');

  // Retrieve all sheet names from the spreadsheet
  let sheetNames = SpreadsheetApp.getActiveSpreadsheet().getSheets().map(sheet => sheet.getName());

  // Create a template from the HTML file
  let htmlTemplate = HtmlService.createTemplateFromFile('show-index-sheet-info');
  htmlTemplate.ongoingTaskSheetName = indexSheetInfo.ongoingTaskSheetName || "";
  htmlTemplate.completedTaskSheetName = indexSheetInfo.completedTaskSheetName || "";
  htmlTemplate.backToIndexPhrase = indexSheetInfo.backToIndexPhrase || "";
  htmlTemplate.completionFlag = indexSheetInfo.completionFlag || "";
  htmlTemplate.sheetNames = sheetNames;  // Pass the sheet names to the template

  let html = htmlTemplate
      .evaluate()
      .setWidth(600)  // Adjusted width
      .setHeight(600); // Adjusted height
  SpreadsheetApp.getUi().showModalDialog(html, 'Index Sheet Information');
}

/**
 * Sets up index sheet information in the script's properties.
 */
function setIndexSheetInfo(indexSheetInfo) {
  try{
    let updatedIndexSheetInfo = {
      'ongoingTaskSheetName': indexSheetInfo.ongoingTaskSheetName,
      'completedTaskSheetName':indexSheetInfo.completedTaskSheetName,
      'backToIndexPhrase':indexSheetInfo.backToIndexPhrase,
      'completionFlag':indexSheetInfo.completionFlag
    };

    // Store general reminder emails in ScriptProperties
    PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_INDEX_SHEET, JSON.stringify(updatedIndexSheetInfo));
    let successDescription = "Index sheet information were successfully set.";
    selectNextAction(successDescription,"success");

  }  catch (error) {
    Logger.log("Error setting index sheet information: " + error.message);
    Logger.log("Stack Trace: " + error.stack);
    let failureDescription = `Failed to set index sheet information.`;
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Sets up staff information in the script's properties.
 */
function setStaffInfo() {
  // Fetch existing data
  let existingStaffString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_STAFF);
  let existingStaff = JSON.parse(existingStaffString || '[]');
  let existingEmails = existingStaff.map(data => data.email);
  let existingNames = existingStaff.map(data => data.name);

  // Get the Google Sheet's current editors
  let ss = SpreadsheetApp.getActiveSpreadsheet();
  let editors = ss.getEditors().map(editor => editor.getEmail());

  // Filter editors that aren't in the existing data
  let newEditors = editors.filter(email => !existingEmails.includes(email));

  // Iterate over the new editors and get their names
  for (let email of newEditors) {
      let name;
      do {
          name = Browser.inputBox(`Input name for the email: ${email}`);
          if (name == 'cancel') {
              Browser.msgBox('Inputting name was cancelled. Retry setting designated user information.');
              return; // Exit the function
          }
          if (existingNames.includes(name.toLowerCase())) { // Check for name's existence using case-insensitive comparison
              Browser.msgBox(`The name "${name}" is already in use. Please use a different name.`);
          }
      } while (!name || existingNames.includes(name)); // Keep prompting until a unique, non-empty name is provided

      // Add this to existing data
      existingStaff.push({name: name, email: email});
  }

  // Store the updated data back
  PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_KEY_STAFF, JSON.stringify(existingStaff));

  // Show confirmation modal
  confirmStaffInfoModal();
}

/**
 * Displays a confirmation modal for staff information setup.
 */
function confirmStaffInfoModal() {
  let existingStaffString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_STAFF);
  let existingStaff = JSON.parse(existingStaffString || '[]');
  // console.log(existingStaff);

  // Create a template from the HTML file
  let htmlTemplate = HtmlService.createTemplateFromFile('show-staff-spreadsheet');
  htmlTemplate.existingStaff = existingStaff;
  
  let html = htmlTemplate
      .evaluate()
      .setWidth(450)  // Adjusted width
      .setHeight(400); // Adjusted height
  SpreadsheetApp.getUi().showModalDialog(html, 'Lists of Staff Information');
}

/**
 * Displays a modal for updating existing staff information.
 */
function updateStaffInfoModal() {
  let existingStaffString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_STAFF);
  let existingStaff = JSON.parse(existingStaffString || '[]');
  // console.log(existingStaff);

  // Create a template from the HTML file
  let htmlTemplate = HtmlService.createTemplateFromFile('update-staff-spreadsheet');
  htmlTemplate.existingStaff = existingStaff;
  
  let html = htmlTemplate
      .evaluate()
      .setWidth(450)  // Adjusted width
      .setHeight(400); // Adjusted height
  SpreadsheetApp.getUi().showModalDialog(html, 'Update Name(s) of the Staff');
}

/**
 * Updates staff information in the script's properties and confirms the update.
 * @param {Object[]} updatedStaffInfo - Array of objects containing updated staff information.
 */
function updateStaffInfo(updatedStaffInfo) {
  try {
    PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_KEY_STAFF, JSON.stringify(updatedStaffInfo));
    confirmStaffInfoModal(); // Make sure this function exists and performs the desired action
  } catch (error) {
    Logger.log("Error in updateStaffInfo: " + error.message);
    let failureDescription = `Failed to show UI where updated staff info is listed.`;
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Displays a modal for setting up emails for general reminders.
 */
function showGeneralReminderEmailsModal() {
  try {
    let existingStaffString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_STAFF);
    // console.log(existingStaffString);
    let existingStaff = JSON.parse(existingStaffString || '[]');

    let generalReminderEmailsString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_GENERAL_REMINDER_EMAILS);
    let generalReminderEmails = JSON.parse(generalReminderEmailsString || '[]');
    
    let htmlTemplate = HtmlService.createTemplateFromFile('show-general-rem-emails');
    htmlTemplate.existingStaff = existingStaff;
    htmlTemplate.generalReminderEmails = generalReminderEmails;

    let html = htmlTemplate
      .evaluate()
      .setWidth(700)  // Adjusted width
      .setHeight(400); // Adjusted height

    SpreadsheetApp.getUi().showModalDialog(html, 'General reminder email will be sent to staff with checked.');
    
  } catch (error) {
    Logger.log("Error showing general reminder emails modal: " + error.message);
    Logger.log("Stack Trace: " + error.stack);
    let failureDescription = `Failed to show UI where staff for General Reminder is listed.`;
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Confirms the setup of general reminder emails.
 * @param {string[]} generalReminderEmails - Array of email addresses for general reminders.
 */
function confirmGeneralReminderEmails(generalReminderEmails) {
  try{
    let updatedGeneralReminderEmails = [];

    generalReminderEmails.forEach(entry => {
        let email = entry.split('|')[1];
        updatedGeneralReminderEmails.push(email);
    });

    // Store general reminder emails in ScriptProperties
    PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_KEY_GENERAL_REMINDER_EMAILS, JSON.stringify(updatedGeneralReminderEmails));
    let successDescription = "Emails to send general reminders were successfully set.";
    selectNextAction(successDescription,"success");

  }  catch (error) {
    Logger.log("Error setting general reminder emails: " + error.message);
    Logger.log("Stack Trace: " + error.stack);
    let failureDescription = `Failed to set emails for General Reminder.`;
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Displays a modal for setting up designated staff for staff-based reminders.
 */
function showDesignatedStaffModal() {
  try {
    let existingStaffString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_STAFF);
    // console.log(existingStaffString);
    let existingStaff = JSON.parse(existingStaffString || '[]');

    let designatedStaffString = PropertiesService.getScriptProperties().getProperty(SCRIPT_PROPERTY_KEY_DESIG_STAFF);
    let designatedStaff = JSON.parse(designatedStaffString || '[]');
    
    let htmlTemplate = HtmlService.createTemplateFromFile('show-desig-staff');
    htmlTemplate.existingStaff = existingStaff;
    htmlTemplate.designatedStaff = designatedStaff;

    let html = htmlTemplate
      .evaluate()
      .setWidth(600)  // Adjusted width
      .setHeight(400); // Adjusted height

    SpreadsheetApp.getUi().showModalDialog(html, 'Staff-based reminder email will be sent to each staff with checked.');
    
  } catch (error) {
    Logger.log("Error showing designated staff info modal: " + error.message);
    Logger.log("Stack Trace: " + error.stack);
    let failureDescription = `Failed to show UI where desigated staff for staff-based reminder is listed.`;
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Sets up designated staff for staff-based reminders.
 * @param {string[]} designatedStaffList - Array of designated staff information.
 */
function setDesignatedStaff(designatedStaffList) {
  try{
    let designatedStaff = [];

    designatedStaffList.forEach(entry => {
        let [name, email] = entry.split('|');
        designatedStaff.push({
            name: name,
            email: email
        });
    });

    // Store designated staff  in ScriptProperties
    PropertiesService.getScriptProperties().setProperty(SCRIPT_PROPERTY_KEY_DESIG_STAFF, JSON.stringify(designatedStaff));
    console.log(`desigantedStaff is ${designatedStaff} and is successfully stored in Script Property.`);
    let successDescription = "Designated staff for staff-based reminders was successfully set.";
    selectNextAction(successDescription,"success");

  }  catch (error) {
    Logger.log("Error setting designated staff info: " + error.message);
    Logger.log("Stack Trace: " + error.stack);

    let failureDescription = `Failed to set designated staff for staff-based reminders.`;
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Displays a modal for setting up reminder URLs.
 */
function showUrlModal() {
  let htmlTemplate = HtmlService.createTemplateFromFile('show-doc-url');
  
  let scriptProperties = PropertiesService.getScriptProperties();
  let generalReminderUrls = JSON.parse(scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_GENERAL_REM_DOC_URL) || '{}');
  let staffBasedReminderData = JSON.parse(scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_STAFFBASED_REM_DATA) || '[]');
  let designatedStaff = JSON.parse(scriptProperties.getProperty(SCRIPT_PROPERTY_KEY_DESIG_STAFF) || '[]');
  

  // Set placeholders for general reminder URLs
  htmlTemplate.generalTodayReminderDocUrl = generalReminderUrls.generalTodayReminderDocUrl;
  htmlTemplate.generalWeekReminderDocUrl = generalReminderUrls.generalWeekReminderDocUrl;

  htmlTemplate.staffBasedReminderData = designatedStaff.map(staff => {
    let staffName = staff.name;

    // Find the corresponding URL object from staffBasedReminderData
    let staffObject = staffBasedReminderData.find(obj => Object.keys(obj)[0] === staffName);
    // console.log(staffObject);

    return {
      name: staffName,
      email: staff.email, // Assuming 'email' is a property of 'staff'
      todayUrl: staffObject ? staffObject[staffName].todayReminderUrl : '',
      nextWeekUrl: staffObject ? staffObject[staffName].nextWeekReminderUrl : ''
    };
  });

  let htmlOutput = htmlTemplate.evaluate().setWidth(700).setHeight(500);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Set Reminder URLs');
}

/**
 * Stores URLs of Google Docs for reminders in the script's properties.
 * @param {Object} passedData - Data containing URLs for reminders.
 */
function storeReminderInfo(passedData) {
  let scriptProperties = PropertiesService.getScriptProperties();
  let invalidUrls = [];
  let allUrlsSet = new Set();

  try {
    // Validate general reminder URLs
    let generalUrls = {
      generalTodayReminderDocUrl: validateGoogleDocUrl_(passedData.generalTodayReminderDocUrl, "Today's General Reminder", invalidUrls, allUrlsSet),
      generalWeekReminderDocUrl: validateGoogleDocUrl_(passedData.generalWeekReminderDocUrl, "Next Week's General Reminder", invalidUrls, allUrlsSet)
    };

    // Count non-null general URLs
    let generalUrlsCount = (generalUrls.generalTodayReminderDocUrl ? 1 : 0) + (generalUrls.generalWeekReminderDocUrl ? 1 : 0);

    // Validate and store staff-based reminder URLs, if they exist
    // Count non-null staff URLs (default is 0)
    let staffUrlsCount = 0;
    let validatedStaffData;
    if (passedData.staffBasedReminderData !== null) {
      validatedStaffData = validateStaffReminderData(passedData.staffBasedReminderData, invalidUrls, allUrlsSet);
      validatedStaffData.forEach(staffObj => {
        Object.values(staffObj).forEach(urlObj => {
          staffUrlsCount += (urlObj.todayReminderUrl ? 1 : 0) + (urlObj.nextWeekReminderUrl ? 1 : 0);
        });
      });
    } else {
      validatedStaffData = null;
    }

    // Check if all URLs are valid and there are no duplicates
    if (invalidUrls.length === 0 && allUrlsSet.size === generalUrlsCount + staffUrlsCount) {
      // Store validated URLs if all conditions are met
      scriptProperties.setProperty(SCRIPT_PROPERTY_KEY_GENERAL_REM_DOC_URL, JSON.stringify(generalUrls));
      if(validatedStaffData !== null){
        scriptProperties.setProperty(SCRIPT_PROPERTY_KEY_STAFFBASED_REM_DATA, JSON.stringify(validatedStaffData));
      }
      let successDescription = "URLs of Google Docs for Reminder were successfully set.";
      selectNextAction(successDescription,"success");
    } else {
      // Handle invalid or duplicate URLs
      let failureDescription = "Invalid or duplicate URLs detected: " + invalidUrls.join(", ") + ". ";
      selectNextAction(failureDescription,"failure");
    }
  } catch (error) {
    Logger.log("Error setting URLs of Google Docs for Reminder: " + error.message);
    Logger.log("Stack Trace: " + error.stack);
    let failureDescription = "Failed to set URLs of Google Docs for reminder.";
    selectNextAction(failureDescription,"failure");
  }
}

/**
 * Validates a Google Document URL and checks for duplicates.
 * @param {string} url - URL of the Google Document.
 * @param {string} reminderType - Type of reminder for logging.
 * @param {string[]} invalidUrls - Array to store invalid URLs.
 * @param {Set} allUrlsSet - Set to store unique URLs for duplicate checking.
 * @returns {string|null} - Validated URL or null if invalid.
 */
function validateGoogleDocUrl_(url, reminderType, invalidUrls, allUrlsSet) {
  if (!url || url.trim() === '') {
    // console.log(`${reminderType} is ${url} and return null.`)
    return null;
  }
  
  let fileId = extractDocIdFromUrl_(url);
  if (fileId && checkIfGoogleDocExists_(fileId) === "Google Doc") {
    if (allUrlsSet.has(url)) {
      console.log(`${reminderType} has duplicate.`);
      // console.log(`Duplicate URL found for ${reminderType}: ${url}`);
      invalidUrls.push(`Duplicate URL found for ${reminderType}`);
      return null;
    } else {
      allUrlsSet.add(url);
      console.log(`${reminderType} unique.`);
      return url;
    }
  } else {
    console.log(`${reminderType} has invalid url.`);
    invalidUrls.push(`URL for ${reminderType} is not for Google Doc`);
    return null;
  }
}

/**
 * Validates the URLs in staff reminder data.
 * @param {Object[]} staffDataArrayObject - Array of objects containing staff reminder data.
 * @param {string[]} invalidUrls - Array to store invalid URLs.
 * @param {Set} allUrlsSet - Set to store unique URLs for duplicate checking.
 * @returns {Object[]} - Array of validated staff reminder data objects.
 */
function validateStaffReminderData(staffDataArrayObject, invalidUrls, allUrlsSet) {
  let validatedStaffArrayObject = [];

  staffDataArrayObject.forEach(obj => {
    let staffName = Object.keys(obj)[0];
    let staffObject = obj[staffName];

    let validObject = {
      email: staffObject.email,
      todayReminderUrl: validateGoogleDocUrl_(staffObject.todayReminderUrl, `Today's Reminder for ${staffName}`, invalidUrls, allUrlsSet),
      nextWeekReminderUrl: validateGoogleDocUrl_(staffObject.nextWeekReminderUrl, `Next Week's Reminder for ${staffName}`, invalidUrls, allUrlsSet)
    };

    let validatedStaffObj = {};
    validatedStaffObj[staffName] = validObject;
    validatedStaffArrayObject.push(validatedStaffObj);
  });

  return validatedStaffArrayObject;
}

/**
 * Extracts the document ID from a given Google Docs URL.
 * @param {string} url - URL of the Google Document.
 * @returns {string|null} - Extracted document ID or null if not found.
 */
function extractDocIdFromUrl_(url) {
  let match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Checks if a Google Document exists and is of the correct type.
 * @param {string} fileId - ID of the Google Document file.
 * @returns {string|boolean} - Returns 'Google Doc' if valid, 'NOT Google Doc' if invalid, or false if not accessible.
 */
function checkIfGoogleDocExists_(fileId) {
  try {
    let file = DriveApp.getFileById(fileId); // Attempt to access the file
    let mimeType = file.getMimeType(); // Get the MIME type of the file
    // Check if the file is a Google Doc
    if (mimeType === "application/vnd.google-apps.document"){
      return "Google Doc";
    } else {
      return "NOT Google Doc"
    }
  } catch (e) {
    // Document does not exist, not accessible, or not a Google Doc
    return false;
  }
}

/**
 * Sets a trigger for sending reminders based on the specified function name.
 * @param {string} functionName - Name of the function to trigger.
 */
function setReminderTrigger(functionName) {
  let successDescription;
  let triggerTime;

  if (functionName === 'runGeneralReminderToday') {
    triggerTime = { hour: 8, everyDays: 1 }; // 8 AM daily
  } else if (functionName === 'runGeneralReminderWeek') {
    triggerTime = { weekDay: ScriptApp.WeekDay.FRIDAY, hour: 16 }; // Every Friday at 4 PM
  } else if (functionName === 'runStaffBasedReminderToday') {
    triggerTime = { hour: 8, everyDays: 1 }; // 8 AM daily
  } else if (functionName === 'runStaffBasedReminderWeek') {
    triggerTime = { weekDay: ScriptApp.WeekDay.FRIDAY, hour: 16 }; // Every Friday at 4 PM
  } else if (functionName === 'updateCompletionStatusToSheet'){
    triggerTime = { hour: 17, everyDays: 1 }; // 5 PM daily
  }

  createTrigger(functionName, triggerTime);
  successDescription = "Trigger for " + functionName + " was successfully set.";
  selectNextAction(successDescription,"success");
}

/**
 * Creates a time-based trigger for a given function.
 * @param {string} functionName - The name of the function to be triggered.
 * @param {Object} triggerTime - An object specifying the time settings for the trigger.
 */
function createTrigger(functionName, triggerTime) {
  let triggerBuilder = ScriptApp.newTrigger(functionName).timeBased();
  console.log(functionName,triggerTime);
  
  if (triggerTime.hour !== undefined) {
    triggerBuilder = triggerBuilder.atHour(triggerTime.hour);
  }
  if (triggerTime.everyDays !== undefined) {
    triggerBuilder = triggerBuilder.everyDays(triggerTime.everyDays);
  }
  if (triggerTime.weekDay !== undefined) {
    triggerBuilder = triggerBuilder.onWeekDay(triggerTime.weekDay);
  }

  triggerBuilder.inTimezone(Session.getScriptTimeZone()).create();
}

/**
 * Deletes a specified reminder trigger.
 * @param {string} functionName - Name of the function whose trigger is to be deleted.
 */
function deleteReminderTrigger(functionName) {
  let triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === functionName) {
      ScriptApp.deleteTrigger(triggers[i]);
      successDescription = "Trigger for " + functionName + " was successfully deleted.";
      selectNextAction(successDescription,"success");
      return;
    }
  }
  successDescription = "No trigger for " + functionName + " was found.";
  selectNextAction(successDescription,"success");
}

/**
 * Checks if a trigger for a given function is already set.
 * @param {string} functionName - Name of the function to check for an existing trigger.
 * @returns {boolean} - True if a trigger is already set, false otherwise.
 */
function isTriggerAlreadySet_(functionName) {
  let triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === functionName) {
      return true;
    }
  }
  return false;
}

/**
 * Deletes a designated script property based on its type.
 * @param {string} settingType - Type of setting associated with the script property.
 * @param {string} scriptyPropertyKey - Key of the script property to be deleted.
 */
function deleteDesignatedScriptProperty(settingType,scriptyPropertyKey) {
    console.log(`settingType is ${settingType} and scriptyPropertyKey ${scriptyPropertyKey}`);
    scriptyPropertyKey = PROPERTY_KEYS[scriptyPropertyKey];
    let scriptProperties = PropertiesService.getScriptProperties();
    if(scriptProperties.getProperty(scriptyPropertyKey) !== null){
      scriptProperties.deleteProperty(scriptyPropertyKey);
      successDescription = `${settingType} was reset.`;
    } else {
      successDescription = `${settingType} has not been set.`;
    }
    selectNextAction(successDescription,"success");
}

/**
 * Resets all script properties and deletes all triggers associated with the script.
 */
function resetScriptPropertiesAndTriggers() {
  let finalConfirmation = Browser.msgBox("Are you SURE to reset ALL Pre-Defined Information and Triggers?",Browser.Buttons.YES_NO);
  if(finalConfirmation !== 'yes'){
    Browser.msgBox("Reset was cancelled.");
    return;
  }
  // Delete all script properties
  PropertiesService.getScriptProperties().deleteAllProperties();
  
  // Retrieve all triggers associated with the script
  let allTriggers = ScriptApp.getProjectTriggers();

  // Loop through and delete each trigger
  for (let i = 0; i < allTriggers.length; i++) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }

  // Show confirmation message
  Browser.msgBox("All of the pre-defined information and triggers have been reset.");
}
