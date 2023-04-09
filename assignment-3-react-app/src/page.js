import React from 'react'
import './page.css'
import axios from 'axios';
import { useState, useEffect } from 'react';
import PokeInfo from './pokeInfo';

function Page(props) {
    const count = 10;
    const startIndex = (props.page - 1) * count;
    const lastIndex = startIndex + count;

    const [currentPokemon, setCurrentPokemon] = useState(null);
    
    const [search, setSearch] = useState('');

    function handleSelectedPokemon(pokemon) {
        console.log(pokemon);
        setCurrentPokemon(pokemon);
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
    console.log(selectedPokemon);

    // filter pokemon by search
    const searchTerm = search.toLowerCase();
    selectedPokemon = selectedPokemon.filter((pokemon) => {
        return pokemon.name.english.toLowerCase().includes(searchTerm);
    });

    let currentPagePokemon = selectedPokemon.slice(startIndex, lastIndex);

    function getPokemonNumber(id) {
      if (id % 1000 < 10) {
        return "00" + id;
      } else if (id % 1000 < 100) {
        return "0" + id;
      }
      return id;
    }

    return (
        <>
            <input className="search" type="search" placeholder="Search Pokemon" onChange={
                (e) => {
                    setSearch(e.target.value);
                }}
            />
            {
                currentPokemon && <PokeInfo pokemon={currentPokemon}/>
            }
            <div className="pageContainer">
                { currentPagePokemon ? currentPagePokemon.map(pokemon => {
                    return <img className={pokemon === currentPokemon && "selectedPokemon"} onClick={() => handleSelectedPokemon(pokemon)} src={"https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/images/" + getPokemonNumber(pokemon.id) + ".png"} />
                }) : <div>Loading Page...</div> }
            </div>
        </>
    )
};

export default Page;
