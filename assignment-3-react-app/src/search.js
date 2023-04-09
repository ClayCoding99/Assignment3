import React from 'react'
import axios from 'axios'
import { useState, useEffect } from 'react';
import './search.css'

export default function Search({setSelectedTypeArray, selectedTypeArray, setPokemon, pokemon}) {

    const [types, setTypes] = useState([]);

    useEffect(() => {
        async function fetchTypes() {
            const response = await axios.get('https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/types.json');
            setTypes(response.data.map(type => type.english));
        }
        fetchTypes();
    }, []);

    function handleClick(e) {
        const {value, checked} = e.target;
        if (checked) {
            setSelectedTypeArray(prevState => [...prevState, value]);
        }
        else {
            setSelectedTypeArray(prevState => prevState.filter(type => type !== value));
        }
    }

  return (
    <>
        {types.map(type => {
            return (
                <div className="searchContainer">
                    <input className="searchCheckbox"
                    type="checkbox" 
                    id={type} name={type} 
                    value={type} 
                    onChange={e => {handleClick(e)}}
                    />
                    <label className="searchLabel" htmlFor={type}>{type}</label>
                </div>
            )
        })}
    </>
  )
}