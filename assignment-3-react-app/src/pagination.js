import React from 'react';
import './pagination.css';

export default function Pagination(props) {

    const count = 10;

    function handleSwitchPage(page, prev = false, next = false) {
        if (next) {
            ++page;
        } else if (prev) {
            --page;
        }
        props.handleSwitchPage(page);
    }

    // filter pokemon by type checked in search
    let selectedPokemon = [];
    if (props.selectedTypeArray != null && props.selectedTypeArray.length > 0) {
        selectedPokemon = props.pokemon.map(pokemon => {
            if (props.selectedTypeArray.every(type => pokemon.type.includes(type))) {
                return pokemon;
            }
        })
        selectedPokemon = selectedPokemon.filter(pokemon => pokemon != undefined);
    } else {
        selectedPokemon = props.pokemon;
    }

    const currentPageCount = Math.ceil(selectedPokemon.length / count);
    const pageNumbers = [];
    for (let i = 1; i <= currentPageCount; i++) {
        pageNumbers.push(i);
    }
    const currentPage = props.page;

    return (
        <div className="pagination">
            <h1>Page {currentPage} of {currentPageCount}</h1>
            {(currentPage !== 1) && (<button onClick={() => handleSwitchPage(currentPage, true, false)}>prev </button>)}
            {
                pageNumbers.map(number => {
                if (number < currentPage + 6 && number > currentPage - 6)
                    return (<>
                    <button onClick={() => handleSwitchPage(number)} className={(number == currentPage) && 'page'}>
                        {number}
                    </button>
                    </>)
                })
            }

            {(currentPage !== currentPageCount) && (<button onClick={() => handleSwitchPage(currentPage, false, true)}>next </button>)}
        </div>
    )
}