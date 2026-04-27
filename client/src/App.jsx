import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from './socket';

import Login      from './components/Login.jsx';
import Lobby      from './components/Lobby.jsx';
import GameScreen from './components/GameScreen.jsx';
import VotingScreen from './components/VotingScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import EndScreen  from './components/EndScreen.jsx';
import ToastArea  from './components/ToastArea.jsx';

// ─── НАЧАЛЬНОЕ СОСТОЯНИЕ ─────────────────────────────
const INIT = {
  screen:          'login',   // login | lobby | game | voting | result | end
  playerId:        null,
  isHost:          false,
  players:         [],
  myCards:         null,
  catastrophe:     null,
  round:           1,
  survivorsTarget: 2,
  timer:           null,
  timerPhase:      null,
  votes:           { hasVoted: [], count: 0, total: 0 },
  forceVote:       { count: 0, needed: 0 },
  messages:        [],
  eliminationData: null,
  endData:         null,
};

export default function App() {
  const [g, setG] = useState(INIT);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const toast = useCallback((text, type = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  const update = useCallback((patch) => setG(prev => ({ ...prev, ...patch })), []);

  // ─── SOCKET EVENTS ────────────────────────────────
  useEffect(() => {
    socket.on('currentState', ({ phase, players }) => {
      if (phase !== 'lobby' && phase !== 'ended') {
        // можно показать сообщение, что игра идёт
      }
      update({ players });
    });

    socket.on('joinedGame', ({ playerId, isHost }) => {
      update({ playerId, isHost, screen: 'lobby' });
    });

    socket.on('updatePlayers', ({ players }) => {
      update({ players });
    });

    socket.on('playerLeft', ({ playerName, players }) => {
      update({ players });
      toast(`${playerName} покинул игру`, 'leave');
    });

    socket.on('gameStarted', ({ catastrophe, players, round, survivorsTarget }) => {
      update({
        screen: 'game',
        catastrophe,
        players,
        round,
        survivorsTarget,
        messages: [],
        votes: { hasVoted: [], count: 0, total: 0 },
        forceVote: { count: 0, needed: 0 },
        eliminationData: null,
      });
    });

    socket.on('playerData', ({ cards }) => {
      update({ myCards: cards });
    });

    socket.on('newRound', ({ round, players }) => {
      update({
        round,
        players,
        screen: 'game',
        eliminationData: null,
        votes: { hasVoted: [], count: 0, total: 0 }
      });
    });

    socket.on('cardOpened', ({ players, playerName, cardType }) => {
      update({ players });
      const labels = {
        profession: 'Профессия', health: 'Здоровье', biology: 'Биология',
        fact: 'Факт', hobby: 'Хобби', baggage: 'Багаж',
      };
      toast(`${playerName} открыл: ${labels[cardType] || cardType}`, 'card');
    });

    socket.on('timerUpdate', ({ remaining, phase }) => {
      update({ timer: remaining, timerPhase: phase });
    });

    socket.on('forceVoteUpdate', ({ count, needed }) => {
      update({ forceVote: { count, needed } });
      toast(`Голосование: за ${count}/${needed}`, 'info');
    });

    socket.on('votingStarted', ({ players, total }) => {
      update({
        screen: 'voting',
        players,
        votes: { hasVoted: [], count: 0, total }
      });
    });

    socket.on('updateVotes', ({ hasVoted, count, total }) => {
      update({ votes: { hasVoted, count, total } });
    });

    socket.on('votingResult', (data) => {
      if (data.gameOver) {
        update({
          screen: 'end',
          eliminationData: data,
          endData: { survivors: data.survivors },
          players: data.players,
        });
      } else {
        update({
          screen: 'result',
          eliminationData: data,
          players: data.players,
        });
      }
    });

    socket.on('chatMessage', (msg) => {
      setG(prev => ({ ...prev, messages: [...prev.messages.slice(-120), msg] }));
    });

    // ✅ ИСПРАВЛЕННЫЙ ОБРАБОТЧИК gameReset
    socket.on('gameReset', ({ players }) => {
      const me = players.find(p => p.id === g.playerId);
      setG({
        ...INIT,
        screen: 'lobby',
        players: players,
        playerId: g.playerId,
        isHost: me ? me.isHost : false,
      });
    });

    socket.on('gameError', (msg) => {
      toast(msg, 'error');
    });

    socket.on('disconnect', () => {
      toast('Соединение потеряно. Переподключение…', 'error');
    });

    socket.on('connect', () => {
      if (g.screen !== 'login') toast('Соединение восстановлено', 'info');
    });

    return () => socket.removeAllListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустые зависимости – эффект срабатывает один раз

  // ─── ACTIONS ──────────────────────────────────────
  const actions = {
    join: (name) => socket.emit('joinGame', { name }),
    startGame: (survivorsCount, timerDuration) =>
      socket.emit('startGame', { survivorsCount, timerDuration }),
    openCard: (cardType) => socket.emit('openCard', { cardType }),
    vote: (targetId) => socket.emit('vote', { targetId }),
    requestForceVoting: () => socket.emit('requestForceVoting'),
    sendChat: (text) => socket.emit('sendChat', { text }),
    resetGame: () => socket.emit('resetGame'),
  };

  // ─── RENDER ───────────────────────────────────────
  const myPlayer = g.players.find(p => p.id === g.playerId);
  const isAlive = myPlayer?.status === 'alive';

  return (
    <>
      <ToastArea toasts={toasts} />

      {g.screen === 'login' && <Login onJoin={actions.join} />}

      {g.screen === 'lobby' && (
        <Lobby
          players={g.players}
          playerId={g.playerId}
          isHost={g.isHost}
          onStart={actions.startGame}
        />
      )}

      {g.screen === 'game' && (
        <GameScreen
          players={g.players}
          playerId={g.playerId}
          isHost={g.isHost}
          isAlive={isAlive}
          myCards={g.myCards}
          catastrophe={g.catastrophe}
          round={g.round}
          survivorsTarget={g.survivorsTarget}
          timer={g.timer}
          timerPhase={g.timerPhase}
          forceVote={g.forceVote}
          messages={g.messages}
          onOpenCard={actions.openCard}
          onForceVoting={actions.requestForceVoting}
          onSendChat={actions.sendChat}
        />
      )}

      {g.screen === 'voting' && (
        <VotingScreen
          players={g.players}
          playerId={g.playerId}
          isAlive={isAlive}
          votes={g.votes}
          timer={g.timer}
          onVote={actions.vote}
        />
      )}

      {g.screen === 'result' && (
        <ResultScreen
          eliminationData={g.eliminationData}
          players={g.players}
          round={g.round}
        />
      )}

      {g.screen === 'end' && (
        <EndScreen
          endData={g.endData}
          eliminationData={g.eliminationData}
          players={g.players}
          catastrophe={g.catastrophe}
          isHost={g.isHost}
          onReset={actions.resetGame}
        />
      )}
    </>
  );
}