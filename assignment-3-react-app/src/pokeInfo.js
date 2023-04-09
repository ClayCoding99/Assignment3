import React from 'react'
import "./pokeInfo.css"

export default function PokeInfo({pokemon}) {
    console.log(pokemon);
  return (
    <div className="pokeInfoContainer">
        <h1>Info</h1>
        <div className="infoContainer">
            <div className="nameContainer">
                <h2>Name</h2>
                <h3>english: {pokemon.name?.english}</h3>
                <h3>japanese: {pokemon.name?.japanese}</h3>
                <h3>chinese: {pokemon.name?.chinese}</h3>
                <h3>french: {pokemon.name?.french}</h3>
            </div>
            <div className="baseContainer">
                <h2>Base</h2>
                <h3>HP: {pokemon.base?.hp}</h3>
                <h3>Attack: {pokemon.base?.attack}</h3>
                <h3>Defense: {pokemon.base?.defense}</h3>
                <h3>Speed Attack: {pokemon?.base["Sp. Attack"]}</h3>
                <h3>Speed Defense: {pokemon?.base["Sp. Defense"]}</h3>
                <h3>Speed: {pokemon.base?.speed}</h3>
            </div>
            <div className="typeContainer">
                <h2>Type</h2>
                {pokemon.type?.map(type => {
                    return (
                        <h3>{type}</h3>
                    )
                })}
            </div>
        </div>
    </div>
  )
}