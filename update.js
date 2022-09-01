const core = require('@actions/core');
const github = require('@actions/github');
const pokemon = require('pokemontcgsdk')
const fs = require('fs')
const { exec } = require("child_process");

const GetSets = async () => {
    const sets = await pokemon.set.all()
    return sets
}

const AssignCards = async (sets) => {
    try {
        const result = []
        for (let i = 0; i < sets.length; i++) {
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
}``

try {
    main().then(data => {
        fs.writeFile('./data/data.json', data, (err, data) => {
            if(err) {
                core.setFailed(err.message)
                return
            }
        })
        core.setOutput("sets", data)
    })

    exec("git add .", (error, stdout, stderr) => {
        if (error) {
            core.setOutput(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            core.setOutput(`stderr: ${stderr}`);
            return;
        }
    });
    exec('git commit -m "Update data"', (error, stdout, stderr) => {
        if (error) {
            core.setOutput(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            core.setOutput(`stderr: ${stderr}`);
            return;
        }
    });
    exec("git push", (error, stdout, stderr) => {
        if (error) {
            core.setOutput(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            core.setOutput(`stderr: ${stderr}`);
            return;
        }
    });
    
    return
} catch (error) {
    core.setFailed(error.message);
}
