import {richTextArrayToString} from "./pages.js";

export async function printDatabaseRow(client, row) {
    let title = ""
    let result = ""
    for (const [propertyName, property] of Object.entries(row.properties)) {
        if (property.type === "title") {
            title = `| ${richTextArrayToString(property.title)}(ID: ${row.id}) |`
        } else {
            result += ` ${propertyName}: ${await getPropertyString(client, property)} |`
        }
    }
    console.log(title + result)
}

export async function getPropertyString(client, property) {
    let result = ""
    switch (property.type) {
        case "checkbox":
            result += property.checkbox ? "[x]" : "[ ]"
            break
        case "created_by":
            result += `${property.created_by.name} (ID: ${property.created_by.id})`
            break
        case "created_time":
            result += property.created_time
            break
        case "date":
            result += dateToString(property.date)
            break
        case "email":
            if (property.email !== null) {
                result += property.email
            }
            break
        case "files":
            result += `[${property.files.map(fileToString).join(", ")}]`
            break
        case "formula":
            switch (property.formula.type) {
                case "number":
                    result += property.formula.number
                    break
                case "string":
                    result += property.formula.string
                    break
                case "date":
                    result += dateToString(property.formula.date)
                    break
                case "boolean":
                    result += property.formula.boolean ? "true" : "false"
                    break
            }
            break
        case "last_edited_by":
            result += `${property.last_edited_by.name} (ID: ${property.last_edited_by.id})`
            break
        case "last_edited_time":
            result += property.last_edited_time
            break
        case "multi_select":
            result += `[${property.multi_select.map(ms => ms.name).join(", ")}]`
            break
        case "number":
            if (property.number !== null) {
                result += property.number
            }
            break
        case "people":
            result += `[${property.people.map(p => p.name).join(", ")}]`
            break
        case "phone_number":
            if (property.phone_number !== null) {
                result += property.phone_number
            }
            break
        case "relation":
            let pageNames = []
            for (const r of property.relation) {
                pageNames.push(await getPageNameByID(client, r.id))
            }
            result += `[${pageNames.join(", ")}]`
            break
        case "rich_text":
            result += property.rich_text.map(r => r.plain_text).join("")
            break
        case "rollup":
            switch (property.rollup.type) {
                case "number":
                    result += property.rollup.number
                    break
                case "array":
                    // The type inside of this array can never be another rollup, so we don't need to worry about infinite recursion
                    let propertyStrings = []
                    for (const a of property.rollup.array) {
                        propertyStrings.push(await getPropertyString(client, a))
                    }
                    result += `[${propertyStrings.join(", ")}]`
                    break
                case "date":
                    result += dateToString(property.rollup.date)
                    break
            }
            break
        case "select":
            if (property.select !== null) {
                result += property.select.name
            }
            break
        case "status":
            result += property.status.name
            break
        case "title":
            result += richTextArrayToString(property.title)
            break
        case "unique_id":
            if (property.unique_id !== null) {
                if (property.unique_id.prefix !== null) {
                    result += `${property.unique_id.prefix}-${property.unique_id.number}`
                } else {
                    result += property.unique_id.number
                }
            }
            break
        case "url":
            if (property.url !== null) {
                result += property.url
            }
            break
    }
    return result
}

export function describeProperty(name, property) {
    switch (property.type) {
        case "checkbox":
            return `${name} - checkbox (boolean)`
        case "date":
            return `${name} - date (date)`
        case "email":
            return `${name} - email (string)`
        case "files":
            // TODO
            break
        case "formula":
            switch (property.formula.type) {
                case "number":
                    return `${name} - formula (number)`
                case "string":
                    return `${name} - formula (string)`
                case "date":
                    return `${name} - formula (date)`
                case "boolean":
                    return `${name} - formula (boolean)`
                default:
                    return `${name} - formula (${property.formula.type})` // shouldn't be possible
            }
        case "multi_select":
            return `${name} - multi-select (list) - options: ${property.multi_select.options.map(ms => ms.name).join(", ")}`
        case "number":
            return `${name} - number (number)`
        case "people":
            return `${name} - people (list)`
        case "phone_number":
            return `${name} - phone number (string)`
        case "rich_text":
            return `${name} - string (string)`
        case "select":
            return `${name} - select (string) - options: ${property.select.options.map(o => o.name).join(", ")}`
        case "status":
            return `${name} - status (string) - options: ${property.status.options.map(o => o.name).join(", ")}`
        case "title":
            return `${name} - title (string)`
        case "url":
            return `${name} - url (string)`
        default:
            return `${name} - ${property.type}`
    }
}

function fileToString(file) {
    let result = ""
    if (file.type === "file") {
        result = `${file.name}: ${file.file.url} (expires ${file.file.expiry_time})`
    } else if (file.type === "external") {
        result = `${file.name} (external): ${file.external.url}`
    }
    return result
}

function dateToString(date) {
    let result = ""
    if (date === null) {
        return result
    }

    if (date.end !== null) {
        result = `${date.start} - ${date.end}`
    } else {
        result = `${date.start}`
    }
    if (date.time_zone !== null && date.time_zone !== "") {
        result += ` (${date.time_zone})`
    }
    return result
}

async function getPageNameByID(client, id) {
    const response = await client.pages.retrieve({page_id: id})
    return response.properties.Name.title[0].plain_text
}

export async function addDatabaseRow(client, databaseID, properties) {
    const retrieval = await client.databases.retrieve({database_id: databaseID})
    let props = {}
    for (const [name, property] of Object.entries(properties)) {
        const propertyType = retrieval.properties[name].type
        let subType = ""
        if (propertyType === "formula") {
            subType = retrieval.properties[name].formula.type
        }

        props[name] = propertyToObject(propertyType, subType, property)
    }

    const response = await client.pages.create({
        parent: {
            type: "database_id",
            database_id: databaseID
        },
        properties: {
            ...props
        }
    })
    console.log(`Created database entry with ID: ${response.id}`)
}

function propertyToObject(type, subType, value) {
    switch (type) {
        case "checkbox":
            return {checkbox: value}
        case "date":
            return {date: value}
        case "email":
            return {email: value}
        case "files":
            // TODO
            break
        case "formula":
            return {formula: {type: subType, subType: value}}
        case "multi_select":
            let val = {multi_select: []}
            for (const v of value) {
                val.multi_select.push({name: v})
            }
            return val
        case "number":
            return {number: value}
        case "people":
            let people = {people: []}
            for (const p of value) {
                people.people.push({object: "user", id: p})
            }
            return people
        case "phone_number":
            return {phone_number: value}
        case "rich_text":
            return {rich_text: [{type: "text", text: {content: value}}]}
        case "select":
            return {select: {name: value}}
        case "status":
            return {status: {name: value}}
        case "title":
            return {title: [{type: "text", text: {content: value}}]}
        case "url":
            return {url: value}
        default:
            return {}
    }
}
