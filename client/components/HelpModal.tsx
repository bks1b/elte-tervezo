import { ChevronDown, HelpCircle, Merge, Pencil, Plus, Search, Upload } from 'lucide-react';
import { useState } from 'react';

import { loadStorage, StorageKey, writeStorage } from '../utils/browser';
import Modal from './Modal';

export default () => {
  const state = useState(() => !loadStorage(StorageKey.HELP) || undefined);
  return <>
    <Modal state={state} title={() => 'Súgó'} handler={() => writeStorage(StorageKey.HELP, true)}>
      {() =>
        <div className='help'>
          <h2>Főoldal</h2>
          <p>
            A főoldalon tárgyakat és kurzusokat lehet{' '}
            <button className='circle'>
              <Search/>
            </button>{' '}
            keresni
          </p>
          <ul>
            <li>
              <b>Tanrend</b> adatbázisból (Lágymányosi kurzusok, <b>fix csoportos órarendek</b>)
            </li>
            <li>
              <b>kurzuslistából</b> (összes ELTE-s kurzus, <b>szakirányok tantervei</b>)
            </li>
          </ul>
          <p>
            és saját adatok alapján{' '}
            <button className='circle'>
              <Plus/>
            </button>{' '}
            hozzáadni és{' '}
            <button className='circle'>
              <Pencil/>
            </button>{' '}
            szerkeszteni, vagy a{' '}
            <button className='circle'>
              <Upload/>
            </button>{' '}
            Neptunból importálni.
          </p>
          <p>
            A hivatalos adatok feldolgozásra kerülnek, pl. a többszörösen felsorolt kurzusok
            egyesülnek, a tárgynevek végződései levágódnak.
          </p>
          <p>
            A kurzusok tárgy szerint vannak{' '}
            <b>csoportosítva</b>, és hozzáadáskor a létező kurzusok kiegészülnek az új adatokkal.
          </p>
          <p>
            Kereséskor a kiválasztott tárgyak <b>összes kurzusa</b>{' '}
            hozzáadásra kerül, ezek közül csak a <input type='checkbox' checked readOnly/>{' '}
            kiválasztottak jelennek meg az órarendben és a listában (az összes kurzus{' '}
            <button className='circle'>
              <ChevronDown/>
            </button>{' '}
            lenyitás után jelenik meg).
          </p>
          <p>
            Az órarend exportálható képként és .ics formátumban, ami importálható{' '}
            <b>naptáralkalmazásokba</b>.
          </p>
          <h2>Órarend generátor</h2>
          <p>
            Az órarend generátor a kiválasztott kurzusok és a megadott szabályok alapján{' '}
            <b>generálja a legkedvezőbb órarendeket</b>.
          </p>
          <p>
            A szabályok járhatnak{' '}
            <b>hibaponttal</b>, ami alapján a megoldások rendezve vannak, vagy lehetnek{' '}
            <b>kötelezőek</b>.
          </p>
          <p>Szabályozni lehet a napokat, pl.:</p>
          <ul>
            <li>
              minden nap legyen 1 óra <b>ebédszünet</b>
            </li>
            <li>
              a 2 óránál <b>hosszabb lyukasóra</b> 20 hibaponttal jár
            </li>
            <li>
              a péntek <b>üres</b> legyen
            </li>
          </ul>
          <p>Szabályozni lehet a tárgyakat és a kurzusokat is, pl.:</p>
          <ul>
            <li>egy szabadon választható tárgy kihagyása 10 hibaponttal jár</li>
            <li>
              egy előadás <b>kihagyható</b> 5 hibaponttal, ha így kedvezőbb az órarend
            </li>
            <li>
              egy előadás <b>csak ütközéssel hagyható ki</b>, 20 hibaponttal
            </li>
          </ul>
          <p>
            Ebédszünetként bármilyen idősáv lefoglalható. Ha egy előadásra nem járnál be, ne is
            válaszd ki. Ha egy tárgy csak az előadás/gyakorlat párjával hagyható ki,{' '}
            <button className='circle'>
              <Merge/>
            </button>{' '}
            egyesíteni kell a kurzusaikat.
          </p>
        </div>}
    </Modal>
    <button onClick={() => state[1](true)}>
      <HelpCircle/>Súgó
    </button>
  </>;
};
