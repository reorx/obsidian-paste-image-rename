import {getRandomHex, getRandomUuid} from './generators'

const dateTmplRegex = /{{DATE:(.+)}}/gm

const replaceDateVar = (s: string, date: moment.Moment): string => {
	const m = dateTmplRegex.exec(s)
	if (!m) return s
	return s.replace(m[0], date.format(m[1]))
}

interface TemplateData {
	imageNameKey: string
	fileName: string
}

export const renderTemplate = (tmpl: string, data: TemplateData) => {
	const now = window.moment()
	let text = tmpl
	let newtext
	while ((newtext = replaceDateVar(text, now)) != text) {
		text = newtext
	}

	text = text
		.replace(/{{imageNameKey}}/gm, data.imageNameKey)
		.replace(/{{fileName}}/gm, data.fileName)
		.replace(/{{uuid}}/gm, getRandomUuid(true, '-'))
		.replace(/{{hex8}}/gm, getRandomHex(8, true))
		.replace(/{{hex4}}/gm, getRandomHex(4, true))
		.replace(/{{hex12}}/gm, getRandomHex(12, true))
		.replace(/{{hex}}/gm, getRandomHex(6, true))		
	return text
}
