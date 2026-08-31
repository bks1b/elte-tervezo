import { ArrowLeft, ArrowRight } from 'lucide-react';
import { createElement, useEffect, useState } from 'react';

import { useData } from '../contexts/data';
import { StorageKey, writeStorage } from '../utils/browser';
import ImportExportMenu from './menus/ImportExportMenu';
import SheetMenu from './menus/SheetMenu';
import TanrendMenu from './menus/TanrendMenu';
import { ResultsProvider } from './results';
import Schedule from './Schedule';
import SubjectOverview from './subjects/SubjectsEditor';

const menus = [{ name: 'Tanrend adatbázis', component: TanrendMenu }, {
  name: 'Kurzuslista',
  component: SheetMenu,
}, { name: 'Import/Export', component: ImportExportMenu }];

export default () => {
  const { subjects, readonly } = useData();
  const [menu, setMenu] = useState(0);
  useEffect(() => void (!readonly[0] && writeStorage(StorageKey.SUBJECTS, subjects[0])), [
    subjects[0],
  ]);
  return <>
    {readonly[0]
      ? <section className='surface' style={{ justifyItems: 'center' }}>
        <header className='toolbar'>
          <h2>Megosztott órarend</h2>
        </header>
        <p>Jelenleg írásvédett módban tekintesz meg egy megosztott órarendet.</p>
        <div className='toolbar'>
          <button onClick={() => location.hash = ''}>
            <ArrowLeft/>
            Saját órarend megnyitása
          </button>
          <button
            onClick={() => {
              readonly[1](false);
              subjects[1](x => ({ ...x }));
              location.hash = '';
            }}
          >
            <ArrowRight/>
            Saját órarend felülírása
          </button>
        </div>
      </section>
      : <ResultsProvider>
        <nav className='tabs'>
          {menus.map(({ name }, i) =>
            <button
              key={name}
              className={i === menu ? 'active' : undefined}
              onClick={() => setMenu(i)}
            >
              {name}
            </button>
          )}
        </nav>
        {createElement(menus[menu].component)}
      </ResultsProvider>}
    <SubjectOverview/>
    <Schedule/>
  </>;
};
