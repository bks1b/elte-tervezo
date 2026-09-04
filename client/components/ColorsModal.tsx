import { Palette, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useImmer } from 'use-immer';

import { Dict } from '../../shared/types';
import { useRequest } from '../contexts/request';
import { loadStorage, StorageKey, writeStorage } from '../utils/browser';
import { useSelect } from '../utils/hooks';
import DisabledButton from './DisabledButton';
import Modal from './Modal';

const EVENT_PREFIX = 'event-';

const DEFAULT_COLORS = { '': '#f03737', 'Előadás': '#0096ff' };

export const className = (x: string) => EVENT_PREFIX + x.replaceAll(' ', '-');

export default () => {
  const { courseTypes } = useRequest();
  const [colors, setColors] = useState<Dict>(() =>
    loadStorage(StorageKey.COLORS) ?? DEFAULT_COLORS
  );
  const colorsModal = useImmer<string[] | undefined>(undefined);
  const colorsRef = useRef<Dict<HTMLInputElement | null>>({});
  useEffect(() => {
    if (courseTypes) {
      courseTypes.forEach(x =>
        document.documentElement.style.setProperty('--' + className(x), colors[x] ?? colors[''])
      );
    }
    writeStorage(StorageKey.COLORS, colors);
  }, [colors, courseTypes]);
  useEffect(() => {
    if (!courseTypes) return;
    const sheet = document.createElement('style');
    sheet.textContent = courseTypes.map(className).map(x =>
      `.fc-event:has(.${x}){background:var(--${x});}`
    ).join('');
    document.head.appendChild(sheet);
    return () => sheet.remove();
  }, [courseTypes]);
  return <>
    <Modal
      state={colorsModal}
      title={() => 'Színek testreszabása'}
      handler={arr => setColors(Object.fromEntries(arr.map(x => [x, colorsRef.current[x]!.value])))}
    >
      {(arr, set) => {
        const remaining = courseTypes!.filter(x => !arr.includes(x));
        const nextKey = useSelect(remaining);
        return <>
          {arr.map((key, i) =>
            <label key={key}>
              {key || 'Alapértelmezett'}:<input
                type='color'
                key={colors[key]}
                defaultValue={colors[key] || colorsRef.current['']!.value}
                ref={x => void (colorsRef.current[key] = x)}
              />
              {!!key && <button className='circle' onClick={() => set(x => void x!.splice(i, 1))}>
                <Trash2/>
              </button>}
            </label>
          )}
          {!!remaining.length && <div className='toolbar'>
            {nextKey.select}
            <button className='circle' onClick={() => set(x => void x!.push(nextKey.value))}>
              <Plus/>
            </button>
          </div>}
          <button
            style={{ justifySelf: 'center' }}
            onClick={() => {
              setColors(DEFAULT_COLORS);
              colorsModal[1](Object.keys(DEFAULT_COLORS));
            }}
          >
            <RefreshCw/>
            Alapértelmezett színek visszaállítása
          </button>
        </>;
      }}
    </Modal>
    <DisabledButton disabled={!courseTypes} onClick={() => colorsModal[1](Object.keys(colors))}>
      <Palette/>
      Színek testreszabása
    </DisabledButton>
  </>;
};
