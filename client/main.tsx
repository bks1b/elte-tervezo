import './styles/main.css';

import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Moon, Sun } from 'lucide-react';
import { createElement, ReactNode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import HelpModal from './components/HelpModal';
import { DataProvider } from './contexts/data';
import { ModalProvider } from './contexts/modal';
import { RequestProvider } from './contexts/request';
import Generator from './generator/Generator';
import Home from './home/Home';
import Router from './Router';
import { loadStorage, StorageKey, writeStorage } from './utils/browser';

const pages: Record<string, { name: string; component: () => ReactNode }> = {
  '': { name: 'Főoldal', component: Home },
  'generator': { name: 'Órarend generátor', component: Generator },
};

const NotFound = () =>
  <section>
    <h1>Az oldal nem található</h1>
  </section>;

const App = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    loadStorage(StorageKey.DARK_MODE) ?? window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    writeStorage(StorageKey.DARK_MODE, darkMode);
  }, [darkMode]);
  return <DataProvider>
    {loaded =>
      <ModalProvider>
        <RequestProvider>
          <Router>
            {(path, navigate) =>
              <main>
                <header>
                  <h1 style={{ fontSize: '1.8rem', marginLeft: '6px' }}>ELTE órarendtervező</h1>
                  <nav>
                    {Object.entries(pages).filter(x => x[0] !== path).map(([page, { name }]) =>
                      <button key={page} onClick={() => navigate(page)}>{name}</button>
                    )}
                    <HelpModal/>
                    <button onClick={() => setDarkMode(x => !x)}>
                      {darkMode
                        ? <>
                          <Sun/> Világos
                        </>
                        : <>
                          <Moon/> Sötét
                        </>} mód
                    </button>
                  </nav>
                </header>
                {loaded && createElement(pages[path]?.component || NotFound)}
                <footer style={{ textAlign: 'center' }}>
                  Készítette: Békési Bence |{' '}
                  <a href='mailto:t9pssp@inf.elte.hu'>t9pssp@inf.elte.hu</a> |{' '}
                  <a href='https://github.com/bks1b/elte-tervezo' target='_blank' rel='noreferrer'>
                    Forráskód
                  </a>
                </footer>
              </main>}
          </Router>
        </RequestProvider>
      </ModalProvider>}
  </DataProvider>;
};

createRoot(document.getElementById('root')!).render(
  <>
    <App/>
    <Analytics/>
    <SpeedInsights/>
  </>,
);
