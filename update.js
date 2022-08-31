const core = require('@actions/core');
const github = require('@actions/github');
const pokemon = require('pokemontcgsdk')
const fs = require('fs')

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

    if(!result) {
        return
    }

    const json = JSON.stringify(result, null, 2)

    return json
}

try {
    core.setOutput("sets", main())
    return
} catch (error) {
    core.setFailed(error.message);
}
