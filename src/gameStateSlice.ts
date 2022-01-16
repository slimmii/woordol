import { createSlice, Dispatch, PayloadAction } from '@reduxjs/toolkit';
import words from './5letterwords.json';
import answers from './answers.json'
import seedrandom from 'seedrandom';
import { RootState } from './store';




export const TIME_ZERO = Date.UTC(2021, 11, 30, 0, 0, 0);

export interface CurrentGame {
  currentTry: number,
  guesses: number,
  day: number,
  answer: string,
  state: string,
  tries: LetterState[][]
}
/**
 * averageGuesses: 1
currentStreak: 1
gamesPlayed: 1
gamesWon: 1
guesses: {1: 1, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, fail: 0}
maxStreak: 1
winPercentage: 100
 */
export interface Statistics {
  currentStreak: number,
  gamesPlayed: number,
  gamesWon: number,
  guesses: { [key: string]: number },
  maxStreak: number,
}

export interface GameState {
  error?: string,
  keyboardLocked: boolean,
  statistics: Statistics,
  currentGame?: CurrentGame
}

type Animation = "flipin" | "flipout" | "none" | "shake";

export interface LetterState {
  letter?: string,
  animation?: Animation,
  evaluation?: "correct" | "present" | "absent" | "tbd"
}

const initialStatistics: Statistics = {
  currentStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  guesses: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0, "fail": 0 },
  maxStreak: 0,
};

const initialState: GameState = {
  error: "",
  keyboardLocked: false,
  statistics: initialStatistics,
  currentGame: undefined
};

const randomlyOrderArrayWithSeed = (array: string[], seed: string): string[] => {
  var rng = seedrandom(seed);
  const shuffled = array.sort(() => rng() - 0.5);
  return shuffled;
}

const getFullDaysBetween = (startUTC: number, endUTC: number): number => {
  const diff = endUTC - startUTC;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export const gameStateSlice = createSlice({
  name: 'gameState',
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    checkLetter: (state, action: PayloadAction<number>) => {
      let currentGame = state.currentGame;
      let letterIndex = action.payload;
      if (currentGame) {
        let currentLetter : string = currentGame.tries[currentGame.currentTry][action.payload].letter!;

        let idx = currentGame.answer.indexOf(currentLetter);

        if (idx === -1) {
          currentGame.tries[currentGame.currentTry][action.payload].evaluation = "absent";
        }
        if (idx === letterIndex) {
          currentGame.tries[currentGame.currentTry][action.payload].evaluation = "correct";
        }
        if (idx !== letterIndex && idx !== -1) {
          currentGame.tries[currentGame.currentTry][action.payload].evaluation = "present";
        }
        
      
      }
    },
    setLetterState: (state, action: PayloadAction<{index: number, letterState: LetterState}>) => {
      let currentGame = state.currentGame;
      if (currentGame) {
        currentGame.tries[currentGame.currentTry][action.payload.index] = action.payload.letterState
      }
    },
    loadGame: (state) => {
      let currentGameIndex = getFullDaysBetween(TIME_ZERO, Date.now());
      state.error = undefined;
      if (!state.statistics) {
        state.statistics = initialStatistics;
      }
      if (!state.currentGame || state.currentGame.day < currentGameIndex) {
        state.currentGame = {
          currentTry: 0,
          guesses: 0,
          day: currentGameIndex,
          answer: answers[currentGameIndex].toUpperCase(),
          state: "PLAYING",
          tries: [
            [{}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}],
          ],
        }
      }
    },
    updateLetterAnimation: (state, action: PayloadAction<{ index: number, animation: Animation }>) => {
      let currentGame = state.currentGame;
      if (currentGame) {
        currentGame.tries[currentGame.currentTry][action.payload.index].animation = action.payload.animation;
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = undefined;
    },
    setKeyboardLock: (state, action: PayloadAction<boolean>) => {
      state.keyboardLocked = action.payload;
    },    
    checkIfWonAndIncrease: (state) => {
      let currentGame = state.currentGame;
      if (currentGame) {
        let guessedWord = currentGame.tries[currentGame.currentTry].map(letter => letter.letter).join("");
        currentGame.guesses++;
        if (guessedWord === currentGame.answer) {
          currentGame.state = "WON";
          state.statistics = {
            currentStreak: state.statistics.currentStreak + 1,
            gamesPlayed: state.statistics?.gamesPlayed + 1,
            gamesWon: state.statistics.gamesWon + 1,
            guesses: {
              ...state.statistics.guesses,
              [currentGame.guesses]: state.statistics.guesses[currentGame.guesses] + 1,
            },
            maxStreak: state.statistics.currentStreak + 1,
          } 
        } else if (currentGame.currentTry === 5) {
          currentGame.state = "LOST";
          state.error = "Helaas! Het woord was " + currentGame.answer;

          state.statistics = {
            currentStreak: 0,
            gamesPlayed: state.statistics?.gamesPlayed + 1,
            gamesWon: state.statistics.gamesWon,
            guesses: {
              ...state.statistics.guesses,
              fail: state.statistics.guesses.fail + 1,
            },
            maxStreak: state.statistics.currentStreak
          }
        } else {
          currentGame.currentTry++;
        }
      }

    },
    setCurrentWord: (state, action: PayloadAction<string>) => {
      let currentGame = state.currentGame;
      if (currentGame) {
        let input = action.payload.split("");
        currentGame.tries[currentGame.currentTry] = [];
        for (let i = 0; i < 5; i++) {
          currentGame.tries[currentGame.currentTry][i] = { letter: input[i], evaluation: 'tbd' };
        }
      }
    }
  }
});

export const { setLetterState, setKeyboardLock, loadGame, checkLetter, setCurrentWord, updateLetterAnimation, checkIfWonAndIncrease, setError,clearError } = gameStateSlice.actions;


export const currentGameSelector = (state: RootState) => state.gameState.currentGame;

export const evaluateWord = (word: string, answer: string) => {
  let evaluations = word.split("").map((letter) : LetterState => {
    return {
      evaluation: "tbd",
      letter: letter
    }
  });

  let remainingLetters = answer.split("").map(l => {
    return {
      letter: l,
      checked: false
    }
  });

  for (let i=0;i<word.length;i++) {
    let idx = answer.indexOf(word[i],i);
    if (idx == i) {
      evaluations[i].evaluation = "correct";
      remainingLetters[i].checked = true;
    }
  }


  // Find the present spots
  for (let i=0;i<word.length;i++) {
    let uncheckedLetters = remainingLetters.filter(e => !e.checked);
    let idx = uncheckedLetters.findIndex(l => l.letter === word[i]);
    if (idx != -1 && evaluations[i].evaluation === "tbd") {
      evaluations[i].evaluation = "present"
      uncheckedLetters[idx].checked = true;
    }
  }

  evaluations = evaluations.map((e, idx) => {
    if (e.evaluation == "tbd") {
      e.evaluation = "absent"
    }
    e.letter = word[idx];
    return e;
  });
  return evaluations;
}

console.log(evaluateWord("GERTA","GEERT"));

export const checkWord = (word: string, answer: string) => async (dispatch: Dispatch) => {
  dispatch(setKeyboardLock(true));

  let evaluations = evaluateWord(word, answer);

  if (word.length == 5) {
    for (let i = 0; i < 5; i++) {
      dispatch(updateLetterAnimation({ index: i, animation: "flipin" }));
      await new Promise(resolve => setTimeout(resolve, 150));
      dispatch(setLetterState({index: i, letterState: evaluations[i]}));
      dispatch(updateLetterAnimation({ index: i, animation: "flipout" }));
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    dispatch(checkIfWonAndIncrease());
  } else {
    for (let i = 0; i < 5; i++) {
      dispatch(updateLetterAnimation({ index: i, animation: "shake" }));
    }
    await new Promise(resolve => setTimeout(resolve, 250));
    for (let i = 0; i < 5; i++) {
      dispatch(updateLetterAnimation({ index: i, animation: "none" }));
    }

    if (word.length != 5) {
      dispatch(setError("Het woord moet 5 letters lang zijn"));
    } else if (!words.map((word) => word.toUpperCase()).includes(word.toUpperCase())) {
      dispatch(setError("Het woord is niet gevonden!"));
    }
  }
  dispatch(setKeyboardLock(false));



}


export default gameStateSlice.reducer;
