'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as util from 'util';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "markdowninclude" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let mdmerge = vscode.commands.registerCommand('extension.MdMerge', async () => {
        MdMerge();
    });

    let mdmergeall = vscode.commands.registerCommand("extension.MdMergeAll", async () => {
        MdMergeAll();
    });

    context.subscriptions.push(mdmerge);
    context.subscriptions.push(mdmergeall);
}

function AddFileExtension(filepath:string){
    if(!filepath.endsWith(".md"))
        filepath+=".md";
    return filepath;
}

function MdMergeAll(){
    var configs = vscode.workspace.getConfiguration("MdMerge");
    var FolderPaths = configs.get<string[]>("FolderPaths");

    var filesTomerge = 0;
    var filesMerged = 0;

    if(FolderPaths.length===0)
    {
        vscode.window.showErrorMessage("No folders in settings. Please add at least one folder to settings");
    }
    else{
        var root = vscode.workspace.rootPath;

        FolderPaths.forEach(element => {
            fs.readdirSync(root + element).forEach(file=>{
                let lines = fs.readFileSync(root + element  + "\\" + file).toString().split(os.EOL);
                let lastline = GetLastNonEmptyLine(lines);
                
                if(!(path.extname(file) === ".md")){
                    //skip
                }
                else if(!lines[lastline].startsWith("!export")){
                    //skip
                }
                else{
                    filesTomerge ++;
                    var destination = root + lines[lastline].match(/\[(.*?)\]/)[1];
                    destination = AddFileExtension(destination);
                    if(fs.existsSync(destination)){
                        fs.writeFileSync(destination,"");
                    }
                    try{
                        writetofile(root + element  + "\\" + file,destination);
                        filesMerged ++;
                    }
                    catch(err){
                        vscode.window.showErrorMessage(err.toString());
                    }
                }

            });
        });
        vscode.window.showInformationMessage(util.format("MdMergeAll Complete. %d of %d merged",filesMerged, filesTomerge)); 
    } 
}

function GetLastNonEmptyLine(lines:string[]){
    let lastline = lines.length-1;

    for(let i = lastline; i>=0;i--){
        var line = lines[i];
        if(line != ""){
            lastline = i;
            break;
        }
            
    }

    return lastline;
}

function MdMerge(){
    var editor = vscode.window.activeTextEditor;
    if(!(editor===undefined)){
        var document = editor.document;
        let lines = fs.readFileSync(document.fileName).toString().split(os.EOL);
        let lastline = GetLastNonEmptyLine(lines);
        var root = vscode.workspace.rootPath;

        if(!editor){
            return;
        }

        if(!document.fileName.endsWith(".md")){
            vscode.window.showErrorMessage("File is not a markdown file.");
            return;
        }
        else if(!lines[lastline].startsWith("!export")){
            vscode.window.showErrorMessage("No !export tag found.");
            return;
        }
        else{
            var destination = root + "\\" + lines[lastline].match(/\[(.*?)\]/)[1];
            destination = AddFileExtension(destination);
            if(fs.existsSync(destination)){
                fs.writeFileSync(destination,"");
            }
            try{
                writetofile(document.fileName,destination);
                vscode.window.showInformationMessage("Output file created");
            }
            catch(err){
                vscode.window.showErrorMessage(err.toString());
            }
        }
    }
    else{
        vscode.window.showErrorMessage("No active documents opened.");
    }
}

function writetofile(sourcepath:string, destination: string){
    try{
        let lines = fs.readFileSync(sourcepath).toString().split(os.EOL);
        var root = vscode.workspace.rootPath;
        
        for(let i=0; i<lines.length;i++){
            if(lines[i].startsWith("!import")){
                var regexp = new RegExp(/\[(.*?)\]/);
                var filepath = lines[i].match(regexp)[1];
                writetofile(root + filepath, destination);
            }
            else if(!lines[i].startsWith("!export")){
                fs.appendFileSync(destination,lines[i]+os.EOL, function(err){
                    if(err != null)
                        console.log(err.message);
                });
            }
        }
        return true;
    }
    catch(err){
        throw err;
    }
}

// this method is called when your extension is deactivated
export function deactivate() {
}