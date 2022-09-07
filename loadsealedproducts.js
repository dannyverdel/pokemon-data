const axios = require('axios')
const fs = require('fs')
const { DOMParser } = require('domparser')
const pokemon = require('pokemontcgsdk')

const GetData = async (type, query = '') => {
    const res = await axios.get(`https://www.cardmarket.com/en/Pokemon/Products/${type}${query}`)
    return res.data
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const GetPackPrices = async () => {
    const obj = []
    try {
        const data = await GetData('Booster-Boxes')
        let parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const pages = parseInt(doc.getElementById('pagination').childNodes[1].childNodes[0].textContent.split(' ')[doc.getElementById('pagination').childNodes[1].childNodes[0].textContent.split(' ').length - 1])
        for (let x = 0; x < pages; x++) {
            const html = await GetData('Booster-Boxes', `?site=${x + 1}`)
            parser = new DOMParser()
            const res = parser.parseFromString(html, 'text/html')

            const div = res.getElementsByClassName('table-body')

            for (let i = 0; i < div[0].childNodes.length; i++) {
                const name = div[0].childNodes[i].childNodes[3].childNodes[0].childNodes[0].textContent
                const price = div[0].childNodes[i].childNodes[5].textContent
                obj.push({
                    name,
                    price: parseFloat(price.replace(' €', '').replace('.', ''))
                })
            }

            await delay(2000)
        }
    } catch (err) {
        console.log(err.message)
    }
    try {
        const data = await GetData('Boosters')
        let parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const pages = parseInt(doc.getElementById('pagination').childNodes[1].childNodes[0].textContent.split(' ')[doc.getElementById('pagination').childNodes[1].childNodes[0].textContent.split(' ').length - 1])
        for (let x = 0; x < pages; x++) {
            const html = await GetData('Boosters', `?site=${x + 1}`)
            parser = new DOMParser()
            const res = parser.parseFromString(html, 'text/html')

            const div = res.getElementsByClassName('table-body')

            for (let i = 0; i < div[0].childNodes.length; i++) {
                const name = div[0].childNodes[i].childNodes[3].childNodes[0].childNodes[0].textContent
                const price = div[0].childNodes[i].childNodes[5].textContent
                obj.push({
                    name,
                    price: parseFloat(price.replace(' €', '').replace('.', ''))
                })
            }
            await delay(2000)
        }
    } catch (err) {
        console.log(err.message)
    }

    const res = []

    const sets = await pokemon.set.all()

    id = 1

    sets.forEach(x => {
        for (let i = 0; i < obj.length; i++) {
            const regex_booster_box = new RegExp(`^${x.name} [a-zA-Z]+ Booster Box$`, 'i')
            const regex_booster = new RegExp(`^${x.name} [a-zA-Z]+ Booster$`, 'i')
            const regex_booster_box_no_wildcard = new RegExp(`^${x.name} Booster Box$`, 'i')
            const regex_booster_no_wildcard = new RegExp(`^${x.name} Booster$`, 'i')

            if (
                (
                    regex_booster_box.test(obj[i].name.toLowerCase()) ||
                    regex_booster.test(obj[i].name.toLowerCase()) ||
                    regex_booster_box_no_wildcard.test(obj[i].name.toLowerCase()) ||
                    regex_booster_no_wildcard.test(obj[i].name.toLowerCase())
                ) && obj[i].price != null
            ) {
                obj[i].id = id
                obj[i].setid = x.id
                id++
                res.push(obj[i])
            }
        }
    })

    return res
}

module.exports.GetPackPrices = GetPackPrices