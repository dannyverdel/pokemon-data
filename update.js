const core = require('@actions/core');
const pokemon = require('pokemontcgsdk')
const { Octokit } = require('@octokit/rest')
const Base64 = require('js-base64')
require("dotenv/config");
const { GetPackPrices } = require('./loadsealedproducts')

var octokit = undefined

const GetSets = async () => {
    const sets = await pokemon.set.all()
    return sets
}

const AssignCards = async (sets) => {
    try {
        const result = []
        for (let i = 0; i < sets.length; i++) {
            const cards = await pokemon.card.where({ q: `set.id:${sets[i].id}` })
            sets[i].cards = cards.data
            sets[i].cards.map(function (item) {
                delete item.attacks
                delete item.weaknesses
                delete item.retreatCost
                delete item.legalities
                delete item.abilities
                delete item.rules
                delete item.flavorText
                return item;
            });
            result.push(sets[i])
            await delay(2000)
        }

        return result
    } catch (err) {
        console.log(err.response.data)
        return undefined
    }
}
``

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

const main = async () => {
    const sets = await GetSets()
    const result = await AssignCards(sets)

    if (!result) {
        return
    }

    const json = JSON.stringify(result, null, 2)

    return json
}

async function GetSHA(file, path) {
    const result = await octokit.request(`GET /repos/dannyverdel/pokemon-data/contents/data/${file}.json`, {
        owner: 'dannyverdel',
        repo: 'pokemon-data',
        path: `data/${file}.json`
    })

    const sha = result?.data?.sha;

    return sha;
}

async function Commit(file, data) {
    const sha = await GetSHA(file);

    const result = await octokit.request(`PUT /repos/dannyverdel/pokemon-data/contents/data/${file}.json`, {
        owner: 'dannyverdel',
        repo: 'pokemon-data',
        path: `data/${file}.json`,
        message: 'update of data',
        committer: {
            name: 'dannyverdel',
            email: 'danny.verdel@gmail.com'
        },
        content: Base64.encode(
            `${data}`
        ),
        sha: sha
    })

    return result?.status || 500;
}

try {
    const token = core.getInput('token')
    octokit = new Octokit({
        auth: token,
    });
    console.log('Starting main()...')
    main().then(sets => {
        Commit('data', sets).then(res => {
            console.log('Starting GetPackPrices()...')
            GetPackPrices().then(packs => {
                Commit('sealed-products', packs).then(res => {
                    console.log(res)
                    core.setOutput("success", 'success')
                })
            })
        })
    })


    return
} catch (error) {
    core.setFailed(error.message);
}
