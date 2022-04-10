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
	return text
}
