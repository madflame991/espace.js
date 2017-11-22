(function () {
	'use strict'

	const SAMPLE_TEXT = [
		'(fun double (n)',
		' (* n 2))',
	].join('\n')


	// setting up the editors
	const inputEditor = ace.edit('input-editor')
	inputEditor.setTheme('ace/theme/monokai')
	inputEditor.setFontSize(18)
	inputEditor.setValue(SAMPLE_TEXT, 1)
	inputEditor.on('input', onInput)

	const outputEditor = ace.edit('output-editor')
	outputEditor.setTheme('ace/theme/monokai')
	outputEditor.getSession().setMode('ace/mode/javascript')
	outputEditor.getSession().setUseWrapMode(true)
	outputEditor.setReadOnly(true)
	outputEditor.setFontSize(18)


	// getting a tokenizer
	const tokenizer = espace.Tokenizer({
		coords: true,
		prefixes: {
			'@': 'set',
			'#': 'map',
		},
	})

	function onInput () {
		const inputText = inputEditor.getValue()
		try {
			const tokens = tokenizer(inputText)
			const tree = espace.Parser.parse(tokens)

			outputEditor.setValue(JSON.stringify(tree, undefined, 2), 1)
		} catch (ex) {
			const exceptionObject = {
				message: ex.message,
				coords: ex.coords,
			}

			outputEditor.setValue(JSON.stringify(exceptionObject, undefined, 2), 1)
		}
	}
})()
