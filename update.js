const core = require('@actions/core');
const pokemon = require('pokemontcgsdk')
const { Octokit } = require('@octokit/rest')
const Base64 = require('js-base64')
require("dotenv/config");

var octokit = undefined

const GetSets = async () => {
    const sets = await pokemon.set.all()
    return sets
}

const AssignCards = async (sets) => {
    try {
        const result = []
        for (let i = 0; i < 2; i++) {
            console.log(sets[i].id)
            const cards = await pokemon.card.where({ q: `set.id:${sets[i].id}` })
            sets[i].cards = cards.data
            sets[i].cards.map(function (item) {
                delete item.attacks
                delete item.weaknesses
                delete item.retreatCost
                delete item.legalities
                delete item.abilities
                delete item.tcgplayer
                delete item.rules
                return item;
            });
            result.push(sets[i])
            await delay(1000)
        }

        return result
    } catch (err) {
        console.log(err.response.data)
        return undefined
    }
}


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

async function GetSHA(path) {
    const result = await octokit.request(`GET /repos/dannyverdel/pokemon-data/contents/data/data.json`, {
        owner: 'dannyverdel',
        repo: 'pokemon-data',
        path: 'data/data.json'
    })

    const sha = result?.data?.sha;

    return sha;
}

async function Commit(data) {
    const sha = await GetSHA(`data/data.json`);

    const result = await octokit.request(`PUT /repos/dannyverdel/pokemon-data/contents/data/data.json`, {
        owner: 'dannyverdel',
        repo: 'pokemon-data',
        path: `data/data.json`,
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

    main().then(data => {
        Commit(data).then(res => {
            console.log(res)
        })
        core.setOutput("success", 'success')
    })

    return
} catch (error) {
    core.setFailed(error.message);
}
