import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './App.css';
import { checkWord, clearError, LetterState, loadGame, setCurrentWord, setKeyboardLock } from './gameStateSlice';
import { RootState } from './store';


interface LetterProps {
  letter?: LetterState,
  animation: string
}

const Letter = ({ letter }: LetterProps) => {
  return (
    <div className={`${letter?.animation} flex-1 flex border-2 border-gray-150 justify-center items-center ${letter?.evaluation === "correct" ? "bg-green-400 border-green-600 text-white animate-wiggle" : ""} ${letter?.evaluation === "present" ? "bg-yellow-400 border-yellow-600 text-white" : ""} ${letter?.evaluation === "absent" ? "bg-gray-400 border-gray-600 text-white" : ""}`}>
      <p className="font-bold">{letter?.letter ?? "‎"}</p>
    </div>
  )
}


const EnterButton = ({ onClick }: { onClick: () => void }) => {
  return <button className="w-16 h-12 p-1  bg-gray-400 rounded-md text-white font-bold" onClick={onClick}>ENTER</button>;
}

const DeleteButton = ({ onClick }: { onClick: () => void }) => {
  return <button className="w-14 h-12 p-1  bg-gray-400 rounded-md text-white font-bold text-xl" onClick={onClick}>⌫</button>;
}
const KeyboardButton = ({ char, onLetter}: { char: string, onLetter: (letter: string) => void}) => {
  let tries = useSelector((state: RootState) => state.gameState.currentGame?.tries);

  let correctLetters : string[] = [];
  let absentLetters : string[] = [];

  if (tries) {
    correctLetters = tries.flatMap((t) => {
      return t.filter(l => l.evaluation === "correct")
    }).map(letter => letter.letter!);
    absentLetters = tries.flatMap((t) => {
      return t.filter(l => l.evaluation === "absent")
    }).map(letter => letter.letter!);
  }
  let color = "bg-gray-400";
  if (correctLetters.includes(char)) {
    color = "bg-green-600";
  }
  if (absentLetters.includes(char)) {
    color = "bg-gray-600";
  }
  return <button className={`w-8 h-12 p-1  ${color} rounded-md text-white font-bold`} onClick={() => { onLetter(char) }}>{char}</button>;
}

const Keyboard = ({ onEnter, onLetter, onDelete }: { onEnter: () => void, onLetter: (letter: string) => void, onDelete: () => void }) => {
  let keyboardLocked = useSelector((state: RootState) => state.gameState.keyboardLocked);
  let state = useSelector((state: RootState) => state.gameState.currentGame?.state);

  return (
    <div className={`flex flex-col p-2 gap-2 keyboardLocked ${keyboardLocked || state === "WON" || state === "LOST" ? "pointer-events-none" : ""}` }>
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
  let next = moment.utc(moment.now()).add(1, 'days').set({ hour: 6, minute: 0, second: 0, millisecond: 0 });
  let diff = moment(moment.utc(moment.now()).diff(next));
  let moment1 = moment.utc(moment.now());
  let moment2 = next;
  let duration = moment.duration(moment2.diff(moment1));
  return moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
}

const Modal = () => {
  const [time, setTime] = useState(getTimeForNextWord());
  const [hidden, setHidden] = useState(false);
  let currentGame = useSelector((state: RootState) => state.gameState.currentGame);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeForNextWord());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const copy = () => {


    let board = currentGame?.tries.slice(0, currentGame?.currentTry).map(tryItem => {
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
    

    navigator.clipboard.writeText(`Woordol ${currentGame?.day} ${currentGame?.currentTry}/6
    
${board}
`);
  }

  return (
    <div id="default-modal" className={`${hidden ? "hidden" :""} max-w-lg w-full absolute top-2 left-1/2 transform -translate-x-1/2`}>
      <div className="relative px-4 w-full max-w-2xl h-full md:h-auto">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex justify-between items-start p-5 rounded-t border-b dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 lg:text-2xl dark:text-white">
              Woordol
            </h3>
            <button onClick={() => { setHidden((hide) => { return !hide}) }} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-toggle="default-modal">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>


          <div className="flex flex-row p-5 gap-5">
            <div className="flex-1 border-r-2">
              <div className="text-white font-bold uppercase text-xl">Volgende</div>
              <div className="text-white">{time}</div>
            </div>

            <div></div>

            <div className="flex-1">
            <button onClick={copy}className="bg-blue-500 flex flex-row hover:bg-blue-600 text-white font-bold py-2 px-4 rounded items-center justify-center w-36">
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

  let currentGame = useSelector((state: RootState) => state.gameState.currentGame);
  const error = useSelector((state: RootState) => state.gameState.error);

  useEffect(() => {
    dispatch(setKeyboardLock(false));
    dispatch(loadGame());
  }, [])

  useEffect(() => {
    let handle = setTimeout(() => {
      dispatch(clearError());
    }, 1500)
    return () => clearTimeout(handle);
  }, [error]);

  if (currentGame) {
    const answer = currentGame.answer;
    const currentTry = currentGame.currentTry;
    const currentWord = currentGame.tries[currentGame.currentTry].map(letter => letter.letter).join("");

    const state = currentGame.state;

    const tries = currentGame.tries;

    return (
      <div className="container h-full max-h-screen max-w-md mx-auto flex justify-center flex-col items-stretch">

        <div className="flex flex-1 flex-col justify-center items-stretch gap-4 p-10">
          {tries.map((row, tryIdx) => {
            return (<div key={"row_" + tryIdx} className="flex flex-1 align-stretch max-h-16 gap-4 ">
              {row.map((letter, idx) => {
                return <Letter key={tryIdx + "_" + (letter.letter ?? " ") + "_" + idx} animation='IDLE' letter={letter} />
              })}
            </div>)
          })}

          
        </div>

      
        <div className="w-96 absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col gap-1 mt-4">
            {error &&  <div key={error} className="w-96 p-3 bg-gray-100 font-bold rounded-md">
              {error}
            </div>}
        </div>

        {(currentGame.state == "WON" || currentGame.state === "LOST") && <Modal />}
        <Keyboard onEnter={async () => {
          dispatch(checkWord(currentWord));
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


}

export default App;
