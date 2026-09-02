import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { mapSubjects } from '../../shared/helpers';
import { sum } from '../../shared/utils';
import Calendar from '../components/Calendar';
import { useData } from '../contexts/data';
import { joinUl, wrapNonEmpty } from '../utils/helpers';
import { ViolationType } from './search/helpers';
import { SearchHandler } from './search/SearchHandler';

const joinMap = (map: object) =>
  joinUl(
    Object.entries(map).filter(x => x[1]).sort((a, b) => b[1] - a[1]).map(x => `${x[0]}: ${x[1]}`),
  );

export default ({ results }: { results: SearchHandler }) => {
  const { subjects } = useData();
  const [pointer, setPointer] = useState(0);
  useEffect(() => setPointer(0), [results]);
  const solution = results.solutions[pointer];
  return <>
    <section className='surface'>
      <h2>Megoldások</h2>
      {solution && <div className='actions'>
        <button onClick={() => setPointer(x => x - 1)} disabled={!pointer}>
          <ArrowLeft/>
          Előző
        </button>
        <p>{pointer + 1}/{results.solutions.length}</p>
        <button
          onClick={() => setPointer(x => x + 1)}
          disabled={pointer >= results.solutions.length - 1}
        >
          <ArrowRight/>
          Következő
        </button>
      </div>}
      {wrapNonEmpty(
        x => <div className='grid'>{x}</div>,
        [
          solution && [
            wrapNonEmpty(
              x => <div key={0}>{x} hibapont{joinMap(solution.violations)}</div>,
              solution.penalty,
            ),
            wrapNonEmpty(
              x => <div key={1}>Kihagyott tárgyak:{x}</div>,
              solution.violations[ViolationType.SUBJECT_SKIP]
                && joinUl(
                  Array.from(
                    new Set(Object.keys(subjects[0])).difference(
                      new Set(
                        Object.entries(solution.selected).flatMap(x =>
                          x[1] ? [JSON.parse(x[0])[0]] : []
                        ),
                      ),
                    ),
                  ),
                ),
            ),
          ],
          [
            wrapNonEmpty(
              x => <div key={0}>Elhagyott megoldások:{x}</div>,
              sum(Object.values(results.pruneCounts)) && joinMap(results.pruneCounts),
            ),
            wrapNonEmpty(
              x => <div key={1}>Elhagyott kurzusok (idősávok):{x}</div>,
              results.removedCourses.length && joinUl(results.removedCourses),
            ),
          ],
        ].map((arr, i) => wrapNonEmpty(x => <div key={i}>{x}</div>, arr)),
      )}
      {!solution && <h2>A megadott szabályoknak egy órarend sem felel meg.</h2>}
    </section>
    {solution
      && <Calendar
        subjects={mapSubjects(subjects[0], (group, path) =>
          solution.selected[JSON.stringify(path)] ? [group] : [])}
        skipped={solution.skipped}
      />}
  </>;
};
