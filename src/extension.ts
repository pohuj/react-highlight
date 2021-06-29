import * as vscode from 'vscode';
import { config } from './config';

const { reactHooks } = config;

export function activate(context: vscode.ExtensionContext) {

	console.log('decorator sample is activated');

	let timeout: NodeJS.Timer | undefined = undefined;

	const hookDecoration = vscode.window.createTextEditorDecorationType({
		borderWidth: '1px',
		borderStyle: 'solid',
		overviewRulerColor: 'blue',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		light: {
			borderColor: 'darkblue'
		},
		dark: {
			borderColor: 'lightblue'
		}
	});

	const hookColor = vscode.window.createTextEditorDecorationType({
		backgroundColor: reactHooks.useEffect.backgroundColor,
		color: reactHooks.useEffect.color,
	});


	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (activeEditor === undefined) {
			return;
		}
	
		const text = activeEditor.document.getText();
	
		const reactImportRegex = /import((.*?)\s*?\{(.*?))\s*?}.*?from\s*'(react|react\-router)';/gm;
		
		const matchReactImport = Array.from(text.matchAll(reactImportRegex));

		if (matchReactImport.length === 0) {
			return;
		}

		const reactImportEndPos = matchReactImport[matchReactImport.length - 1].index! + matchReactImport[matchReactImport.length - 1][0].length;

		const foundReactHooks = [];
		for (let i = 0; i < matchReactImport.length; i++) {
			const group = matchReactImport[i];
			const hooksInGroup = group[3];

			const splittedHooks = hooksInGroup.split(',').map(hook => hook.trim());

			foundReactHooks.push(...splittedHooks);
		}
	
		const foundHooks = [];
		for (const foundReactHook of foundReactHooks) {
			const trimmedHook = foundReactHook.trim();
			
			if (reactHooks.hasOwnProperty(trimmedHook) === false) {
				continue;
			}
	
			foundHooks.push(trimmedHook);
		}
	
		if (foundHooks.length === 0) {
			return;
		}
	
		const builtRegex = foundHooks.join('|');
		
		const regexp = new RegExp(builtRegex, 'g');
		
		let match;
		const hookDecorations: vscode.DecorationOptions[] = [];

		while (match = regexp.exec(text)) {
			if (match.index < reactImportEndPos) {
				continue;
			}

			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
	
			const hookDecoration = { range: new vscode.Range(startPos, endPos) };
			hookDecorations.push(hookDecoration);
		}

		activeEditor.setDecorations(
			hookDecoration,
			hookDecorations,
		);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

}

