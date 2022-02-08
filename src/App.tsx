import { stat } from 'fs';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { checkWord, clearError, LetterState, loadGame, setCurrentWord, setError, setKeyboardLock } from './gameStateSlice';
import { RootState } from './store';


interface LetterProps {
  letter?: LetterState,
  animation: string
}

const isMobile = () => {
  // credit to Timothy Huang for this regex test: 
  // https://dev.to/timhuang/a-simple-way-to-detect-if-browser-is-on-a-mobile-device-with-javascript-44j3
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    return true
  }
  else {
    return false
  }
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

export function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}


const Letter = ({ letter }: LetterProps) => {
  const { height, width } = useWindowDimensions();

  let size = Math.min((height - 160) / 11, (width - 160) / 4);

  return (
    <div className={`${letter?.animation} flex border-2 border-gray-150 justify-center items-center ${letter?.evaluation === "correct" ? "bg-green-400 border-green-600 text-white animate-wiggle" : ""} ${letter?.evaluation === "present" ? "bg-yellow-400 border-yellow-600 text-white" : ""} ${letter?.evaluation === "absent" ? "bg-gray-400 border-gray-600 text-white" : ""}`}>
      <div className="flex justify-center items-center" style={{ height: size, width: size, maxWidth: '3.5rem', maxHeight: '3.5rem' }}>
        <p className="font-bold">{letter?.letter ?? "‎"}</p>
      </div>
    </div>
  )
}


const EnterButton = ({ onClick }: { onClick: () => void }) => {
  return <button className="w-16 h-12 p-1  bg-gray-400 rounded-md text-white font-bold" onClick={(e) => { e.currentTarget.blur(); onClick()}}>ENTER</button>;
}

const DeleteButton = ({ onClick }: { onClick: () => void }) => {
  return <button className="w-14 h-12 p-1  bg-gray-400 rounded-md text-white font-bold text-xl" onClick={(e) => { e.currentTarget.blur(); onClick()}}>⌫</button>;
}
const KeyboardButton = ({ char, onLetter }: { char: string, onLetter: (letter: string) => void }) => {
  let tries = useSelector((state: RootState) => state.gameState.currentGame?.tries);

  let correctLetters: string[] = [];
  let absentLetters: string[] = [];
  let presentLetters: string[] = [];

  if (tries) {
    correctLetters = tries.flatMap((t) => {
      return t.filter(l => l.evaluation === "correct")
    }).map(letter => letter.letter!);
    absentLetters = tries.flatMap((t) => {
      return t.filter(l => l.evaluation === "absent")
    }).map(letter => letter.letter!);
    presentLetters = tries.flatMap((t) => {
      return t.filter(l => l.evaluation === "present")
    }).map(letter => letter.letter!);
  }
  let color = "bg-gray-400";
  if (correctLetters.includes(char)) {
    color = "bg-green-600";
  }
  if (absentLetters.includes(char)) {
    color = "bg-gray-600";
  }
  if (presentLetters.includes(char)) {
    color = "bg-yellow-400";
  }
  return <button className={`w-8 h-12 p-1  ${color} rounded-md text-white font-bold`} onClick={(e) => { e.currentTarget.blur(); onLetter(char) }}>{char}</button>;
}

const Keyboard = ({ onEnter, onLetter, onDelete }: { onEnter: () => void, onLetter: (letter: string) => void, onDelete: () => void }) => {
  let keyboardLocked = useSelector((state: RootState) => state.gameState.keyboardLocked);
  let state = useSelector((state: RootState) => state.gameState.currentGame?.state);

  return (
    <div className={`flex flex-col m-2 gap-2 keyboardLocked ${keyboardLocked || state === "WON" || state === "LOST" ? "pointer-events-none" : ""}`}>
      <div className="flex flex-1 gap-2 justify-center">
        <KeyboardButton char="Q" onLetter={onLetter} />
        <KeyboardButton char="W" onLetter={onLetter} />

        <KeyboardButton char="E" onLetter={onLetter} />
        <KeyboardButton char="R" onLetter={onLetter} />
        <KeyboardButton char="T" onLetter={onLetter} />
        <KeyboardButton char="Y" onLetter={onLetter} />
        <KeyboardButton char="U" onLetter={onLetter} />
        <KeyboardButton char="I" onLetter={onLetter} />
        <KeyboardButton char="O" onLetter={onLetter} />
        <KeyboardButton char="P" onLetter={onLetter} />

      </div>
      <div className="flex flex-1 gap-2 justify-center">
        <KeyboardButton char="A" onLetter={onLetter} />
        <KeyboardButton char="S" onLetter={onLetter} />
        <KeyboardButton char="D" onLetter={onLetter} />
        <KeyboardButton char="F" onLetter={onLetter} />
        <KeyboardButton char="G" onLetter={onLetter} />
        <KeyboardButton char="H" onLetter={onLetter} />
        <KeyboardButton char="J" onLetter={onLetter} />
        <KeyboardButton char="K" onLetter={onLetter} />
        <KeyboardButton char="L" onLetter={onLetter} />

      </div>
      <div className="flex flex-1 gap-2 justify-center">
        <EnterButton onClick={onEnter} />
        <KeyboardButton char="Z" onLetter={onLetter} />
        <KeyboardButton char="X" onLetter={onLetter} />
        <KeyboardButton char="C" onLetter={onLetter} />
        <KeyboardButton char="V" onLetter={onLetter} />
        <KeyboardButton char="B" onLetter={onLetter} />
        <KeyboardButton char="N" onLetter={onLetter} />
        <KeyboardButton char="M" onLetter={onLetter} />

        <DeleteButton onClick={() => { onDelete() }} />
      </div>
    </div>
  )
}

const getTimeForNextWord = () => {
  let next = moment.utc(moment.now()).add(1, 'days').set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  let diff = moment(moment.utc(moment.now()).diff(next));
  let moment1 = moment.utc(moment.now());
  let moment2 = next;
  let duration = moment.duration(moment2.diff(moment1));
  return moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
}

const HelpModal = ({showHelp} : { showHelp : (show: boolean) => void }) => {
  return (
    <div id="default-modal" className={`max-w-lg w-full absolute top-2 left-1/2 transform -translate-x-1/2 transition duration-500 ease-in-out shadow-xm`}>
      <div className="relative px-4 w-full max-w-2xl h-full md:h-auto overflow-auto">
        <div className="relative bg-white rounded-lg shadow p-4">
          
          <div className="flex flex-row">
            <p className="mb-2">Raad de <b>WOORDOL</b> in 6 pogingen.</p>
            <button onClick={() => { showHelp(false) }} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="default-modal">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>

          <p className="mb-2">Elke poging moet een bestaand 5 letter woord zijn. Druk op enter om het woord te controleren.</p>

          <p className="mb-2">Na elke poging zal de kleur van de vakken aangepast worden om aan te geven hoe goed jouw gok was.</p>

          <div className="flex flex-row gap-2">
            <Letter letter={{letter: 'R', animation: 'none', evaluation: 'correct'}} animation=""></Letter>
            <Letter letter={{letter: 'E', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'C', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'H', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'T', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>

          </div>

          <p className="mt-2 mb-2">De letter R is in het woord en op de juiste plaats.</p>

          <div className="flex flex-row gap-2">
            <Letter letter={{letter: 'B', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'E', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'V', animation: 'none', evaluation: 'present'}} animation=""></Letter>
            <Letter letter={{letter: 'E', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'R', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>

          </div>

          <p className="mt-2 mb-2">De letter V is in het woord maar niet op de juiste plaats.</p>

          <div className="flex flex-row gap-2">
            <Letter letter={{letter: 'S', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'T', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'E', animation: 'none', evaluation: 'absent'}} animation=""></Letter>
            <Letter letter={{letter: 'R', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>
            <Letter letter={{letter: 'K', animation: 'none', evaluation: 'tbd'}} animation=""></Letter>

          </div>

          <p className="mt-2 mb-2">De letter E komt niet in het woord voor.</p>
        
          <p className="mt-2">Elke dag zal er een nieuwe WOORDOL beschikbaar zijn! </p>
        </div>
      </div>
    </div>
  )
}

const StatsModal = ({showStats} : { showStats : (show: boolean) => void }) => {
  const [time, setTime] = useState(getTimeForNextWord());
  const dispatch = useDispatch();

  let currentGame = useSelector((state: RootState) => state.gameState.currentGame);
  let statistics = useSelector((state: RootState) => state.gameState.statistics);


  let sum = Object.values(statistics.guesses).reduce((p, c) => p + c, 0);
  sum = 10;

  let max = Math.max(...Object.values(statistics.guesses));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeForNextWord());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const copy = async () => {


    let board = currentGame?.tries.slice(0, currentGame?.guesses).map(tryItem => {
      return tryItem.map(letter => {
        if (letter.evaluation === "present") {
          return "🟨"
        } else if (letter.evaluation === "absent") {
          return "⬜"
        } else if (letter.evaluation === "correct") {
          return "🟩"
        }
      }).join("")
    }).join("\n");


    let shareText = `Woordol ${currentGame?.day} ${currentGame?.guesses}/6
    
${board}
`;

    if (isMobile()) {
      const shareData = {
        title: 'Woordol',
        text: shareText
      }
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareText);

      dispatch(setError("Tekst gedeeld op clipboard"));
    }

  }

  return (
    <div id="default-modal" className={`max-w-lg w-full absolute top-2 left-1/2 transform -translate-x-1/2`}>
      <div className="relative px-4 w-full max-w-2xl h-full md:h-auto">
        <div className="relative bg-white rounded-lg shadow ">
          <div className="flex justify-between items-start p-5 rounded-t border-b ">
            <h3 className="text-xl font-semibold text-gray-900 lg:text-2xl ">
              Woordol
            </h3>
            <button onClick={() => { showStats(false) }} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="default-modal">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>

          <div className="flex flex-col items-stretch">
            <div className="flex justify-center">
              <h1 className="text-sm font-semibold uppercase text-gray-900">Statistieken</h1>
            </div>
            <div className="flex flex-row gap-1 p-2">
              <div className="flex-1">
                <div className="flex justify-center items-center text-xl font-bold">{statistics.gamesPlayed}</div>
                <div className="flex justify-center items-center text-xs">Played</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-center items-center text-xl font-bold">{statistics.gamesPlayed != 0 ? Math.floor((statistics.gamesWon / statistics.gamesPlayed) * 100) : 0}%</div>
                <div className="flex justify-center items-center text-xs">Win</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-center items-center text-xl font-bold">{statistics.currentStreak}</div>
                <div className="flex justify-center items-center text-xs">Current Streak</div>
              </div>
              <div className="flex-1">
                <div className="flex justify-center items-center text-xl font-bold">{statistics.maxStreak}</div>
                <div className="flex justify-center items-center text-xs">Max Streak</div>
              </div>
            </div>
          </div>


          <div className="p-2 m-4">
            {Object.entries(statistics.guesses).filter(([k, v]) => k != 'fail').map(([k, v]: any) => {
              return (
                <div className="flex flex-row m-1">
                  <div className="w-8 font-light text-sm">{k}</div>
                  <div className="flex-1 flex items-center">
                    {v > 0 && <div className="flex p-1 text-white font-bold justify-end bg-blue-600" style={{ fontSize: 10, width: `${v / max * 100}%`, height: "100%" }}>
                      {v}
                    </div>}

                    {v == 0 && <div className="text-black font-bold" style={{fontSize: 10}}>{v}</div>}
                  </div>
                </div>
              );
            })}

          </div>


          <div className="flex flex-row p-5 gap-5">
            <div className="flex-1 border-r-2">
              <div className="text-black font-bold uppercase text-xl">Volgende</div>
              <div className="text-black">{time}</div>
            </div>

            <div className="flex-1">
              <button onClick={copy} className="bg-blue-500 flex flex-row hover:bg-blue-600 text-white font-bold py-2 px-4 rounded items-center justify-center w-36">
                <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path fill="var(--white)" d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92c0-1.61-1.31-2.92-2.92-2.92zM18 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 7.02c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path></svg>
                <span className="text-lg">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const dispatch = useDispatch();
  let rootRef = useRef<HTMLDivElement>(null);
  let keyboardLocked = useSelector((state: RootState) => state.gameState.keyboardLocked);
  const [showStats, setShowStats] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  let currentGame = useSelector((state: RootState) => state.gameState.currentGame);
  const error = useSelector((state: RootState) => state.gameState.error);

  useEffect(() => {
    dispatch(setKeyboardLock(false));
    dispatch(loadGame());
    rootRef.current?.focus();
  }, [])

  useEffect(() => {
    let handle = setTimeout(() => {
      dispatch(clearError());
    }, 1500)
    return () => clearTimeout(handle);
  }, [error]);

  useEffect(() => {
    if (currentGame) {
      if (currentGame.state == "WON" || currentGame.state === "LOST") {
        setShowStats(true)
      }
    }
  }, [currentGame?.state]);

  try {
    if (currentGame) {
      const currentWord = currentGame.tries[currentGame.currentTry].map(letter => letter.letter).join("");
      const answer = currentGame.answer;

      const tries = currentGame.tries;

      return (
        <div className="select-none outline-none container h-full max-h-screen max-w-md mx-auto flex justify-end flex-col items-stretch" tabIndex={-1} ref={rootRef} onKeyDown={(e) => {
          if (keyboardLocked || currentGame?.state === "WON" || currentGame?.state === "LOST") {
            return;
          }

          if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
          }
          // check if key is letter
          if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
            dispatch(setCurrentWord(currentWord + e.key.toUpperCase()))
          }
          // check if key is enter
          if (e.key === "Enter") {
            console.log("Enter by real keyboard");
            dispatch(checkWord(currentWord, answer));
          }
          // check if key is backspace
          if (e.key === "Backspace") {
            dispatch(setCurrentWord(currentWord.slice(0, -1)))
          }
        }}>
          <div className="h-12 min-h-max flex justify-center items-center font-bold text-xl">
            <div className="ml-2"><svg onClick={() => { setShowHelp(true); }} xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
              <path fill="var(--color-tone-3)" d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"></path>
            </svg></div>
            <div className="flex flex-1 justify-center items-center ">🇧🇪 WOORDOL 🇧🇪 </div>
            <div className="mr-2">
              <svg onClick={() => { setShowStats(true); }} xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                <path fill="var(--color-tone-3)" d="M16,11V3H8v6H2v12h20V11H16z M10,5h4v14h-4V5z M4,11h4v8H4V11z M20,19h-4v-6h4V19z"></path>
              </svg>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center items-stretch">

            {tries.map((row, tryIdx) => {
              return (<div key={"row_" + tryIdx} className="flex-1 flex items-center justify-center flex-row gap-4 ">
                {row.map((letter, idx) => {
                  return <Letter key={tryIdx + "_" + (letter.letter ?? " ") + "_" + idx} animation='IDLE' letter={letter} />
                })}
              </div>)
            })}


          </div>




          {showStats && <StatsModal showStats={ (show: boolean) => setShowStats(show)} />}
          {showHelp && <HelpModal showHelp={ (show: boolean) => setShowHelp(show)} />}


          <div className="w-96 absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col gap-1 mt-4">
            {error && <div key={error} className="w-96 p-3 bg-gray-100 font-bold rounded-md">
              {error}
            </div>}
          </div>
          <Keyboard onEnter={async () => {
            console.log("Enter by virtual keyboard");
            dispatch(checkWord(currentWord, answer));
          }} onLetter={(letter: string) => {
            dispatch(setCurrentWord(currentWord + letter.toUpperCase()));
          }} onDelete={() => {
            console.log(currentWord.slice(0, currentWord.length - 1));
            dispatch(setCurrentWord(currentWord.slice(0, currentWord.length - 1)));
          }} />
        </div>
      );
    } else {
      return <div>Loading...</div>
    }
  } catch (e) {
    return <div>error</div>
  }

}

export default App;
