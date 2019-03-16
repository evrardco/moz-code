// @ts-nocheck
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const {spawn}  = require('child_process');
const fs = require('fs');

//the thing that may read ozengine stuff
let socket = undefined;
let ozengine = undefined;
let telnet = undefined;
let ports = undefined;
let channel = undefined;
let setup = false;
let setupPromise = undefined;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
async function sendData(data){
	await setupPromise;
	telnet.stdin.write(data.toString());
	//sending char to feed the buffer
	telnet.stdin.write('\n\004\n');
	
}

function sendFile(fileName){
	fs.readFile(fileName, (err, data) => {
		if (err) throw err;
		//channel.append(data.toString())
		sendData(data);	
	});
}


function feedCurrentFile(){
	channel.show();
	var filePath = vscode.window.activeTextEditor.document.fileName;
	
	if(filePath !== undefined){
	//If we are in an editor
		sendFile(filePath);
		
	}else vscode.window.showInformationMessage('You must be in an editor to compile oz !');
}




async function feedSelection(){
	channel.show();

	filePath = vscode.window.activeTextEditor.document.fileName;
	if(filePath !== undefined){
	//If we are in an editor
		
		data = vscode.window.activeTextEditor.selection;
		data = vscode.window.activeTextEditor.document.getText(data);
		channel.append('Feeding selection... ');

		sendData(data.toString());
		
		

	}else vscode.window.showInformationMessage('You must be in an editor to compile oz !');
}
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "moz-code" is now active!');
	console.log('server started');
	channel = vscode.window.createOutputChannel('ozengine');
	vscode.window.showInformationMessage('');
	
	channel.append("Starting the ozengine...");

	setupPromise = new Promise((resolve, reject) =>	{
		ozengine = spawn('ozengine', ["x-oz://system/OPI.ozf"]);
		ozengine.stdout.addListener("data", function(msg){
			//extracting ports from the string
			channel.append(msg.toString());
			ports = msg.toString().replace(/'/, '').split(" ").slice(1, 3);
			ports[0] = parseInt(ports[0]);
			ports[1] = parseInt(ports[1]);
			//allows the server to read ozengine
			console.log('ports extracted');
			let telnetPromise;
			telnet = spawn('telnet', ["localhost", ports[0]]);
			
			telnet.stdout.addListener("data", function(msg){
				channel.append(msg.toString());
				console.log('telnet spawned');
				setup = true;
				channel.append("Everything is setup !");
				resolve("telnet started");
			});
			
		});
	});
		// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposableBuildAndRun = vscode.commands.registerCommand('extension.buildAndRunOz', feedCurrentFile);	
	let disposableFeedSelection = vscode.commands.registerCommand('extension.feedSelection', feedSelection);	

	context.subscriptions.push(disposableBuildAndRun);
	context.subscriptions.push(disposableFeedSelection);

}
exports.activate = activate;


// this method is called when your extension is deactivated
function deactivate() {
	ozengine.kill();
	telnet.kill();
}


module.exports = {
	activate,
	deactivate
}
