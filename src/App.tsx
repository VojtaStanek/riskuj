import React, { Component } from 'react'
import './App.css'
import { QUESTIONS } from './questions'

type TeamId = string

type GroupId = string

// type
type GridTo<T> = { [col in GroupId]: { [row: number]: T } }

interface GameState {
	points: { [_ in TeamId]: number }
	questions: GridTo<TeamId | undefined>
	teamOnTurn: TeamId
}

interface AppState {
	gameState: GameState
	openQuestion: [GroupId, number] | undefined
	openedCorrect: Correctness | undefined
}

export interface Question {
	group: GroupId
	row: number
	question: string
}

// const QUESTIONS: Question[] = []

// reduce(function (r, a) {
//   r[a.make] = r[a.make] || [];
//   r[a.make].push(a);
//   return r;
// }, Object.create(null));

const GROUPS = QUESTIONS.map(t => t.group).reduce<GroupId[]>(
	(acc, v) => (acc.includes(v) ? acc : [...acc, v]),
	[]
)
const ROWS = QUESTIONS.map(t => t.row)
	.reduce<number[]>((acc, v) => (acc.includes(v) ? acc : [...acc, v]), [])
	.sort()

const TEAMS: TeamId[] = ['A', 'B', 'C']
const TEAMS_COUNT = TEAMS.length

enum Correctness {
	Correct = 'Correct',
	Wrong = 'Wrong'
}

const nextTeam = (team: TeamId) =>
	TEAMS[(TEAMS.indexOf(team) + 1) % TEAMS.length]

class App extends Component<{}, AppState> {
	state: AppState = {
		gameState: {
			points: {
				...TEAMS.reduce((a, t) => ({ ...a, [t]: 0 }), {})
			},
			questions: {},
			teamOnTurn: TEAMS[0]
		},
		openQuestion: undefined,
		openedCorrect: undefined
	}

	componentDidMount() {
		document.addEventListener('keydown', event => {
			let correctMultiplier = 0
			let correctness = Correctness.Wrong
			switch (event.key) {
				case 'c':
					correctMultiplier = 1
					correctness = Correctness.Correct
				case 'w':
					this.setState(state => {
						if (!state.openQuestion || state.openedCorrect) return state
						return {
							...state,
							openedCorrect: correctness,
							// openQuestion: undefined,
							gameState: {
								...state.gameState,
								teamOnTurn: nextTeam(state.gameState.teamOnTurn),
								points: {
									...state.gameState.points,
									[state.gameState.teamOnTurn]:
										state.gameState.points[state.gameState.teamOnTurn] +
										(state.openQuestion as [unknown, number])[1] *
											correctMultiplier
								},
								questions: {
									...state.gameState.questions,
									[(state.openQuestion as [GroupId, number])[0]]: {
										...(state.gameState.questions[
											(state.openQuestion as [GroupId, number])[0]
										] || {}),
										[(state.openQuestion as [GroupId, number])[1]]:
											state.gameState.teamOnTurn
									}
								}
							}
						}
					})
					break
				case 'x':
				case 'p':
					this.setState(state => ({
						...state,
						openQuestion: undefined,
						openedCorrect: undefined
					}))
					break
				case 'n':
					this.setState(state => ({
						...state,
						openQuestion: undefined,
						gameState: {
							...state.gameState,
							teamOnTurn: nextTeam(state.gameState.teamOnTurn)
						}
					}))
					break
				case 'ArrowUp':
					this.setState(state => ({
						...state,
						gameState: {
							...state.gameState,
							points: {
								...state.gameState.points,
								[state.gameState.teamOnTurn]:
									state.gameState.points[state.gameState.teamOnTurn] + 1000
							}
						}
					}))
					break
				case 'ArrowDown':
					this.setState(state => ({
						...state,
						gameState: {
							...state.gameState,
							points: {
								...state.gameState.points,
								[state.gameState.teamOnTurn]:
									state.gameState.points[state.gameState.teamOnTurn] - 1000
							}
						}
					}))
					break
				default:
					console.log(`Unknown key ${event.key}`)
			}
		})
	}

	renderQuestion(question: Question): React.ReactNode {
		const questions = this.state.gameState.questions
		const q =
			questions &&
			questions[question.group] &&
			questions[question.group][question.row]
		return (
			<div
				className="cell"
				style={
					{
						'--row': ROWS.indexOf(question.row),
						'--group': GROUPS.indexOf(question.group)
					} as any
				}
				onClick={() => {
					this.setState(state => ({
						...state,
						openQuestion: [question.group, question.row]
					}))
				}}
			>
				<div
					className={`cell-inner ${
						q ? `answered ofTeam${TEAMS.indexOf(q)}` : `open`
					}`}
				>
					{question.row}
				</div>
			</div>
		)
	}

	render() {
		const { gameState, openQuestion, openedCorrect } = this.state
		// const groups
		const groupedQuestions = QUESTIONS.reduce<GridTo<Question>>(
			(r, v) => ({
				...r,
				[v.group]: { ...(r[v.group] || {}), [v.row]: v }
			}),
			{}
		)

		const allAnswered =
			GROUPS.every(g => typeof gameState.questions[g] !== 'undefined') &&
			Object.values(gameState.questions).every(g =>
				ROWS.every(r => g && Object.keys(g).includes(r.toString()))
			)
		return (
			<div className="App">
				{openQuestion && (
					<div
						className={`openedQuestion is${
							openedCorrect ? openedCorrect : 'None'
						}`}
					>
						<div className="openedQuestion-content">
							<div className="openedQuestion-label">
								{openQuestion[0]} za {openQuestion[1]}
							</div>
							<div className="openedQuestion-question">
								{groupedQuestions[openQuestion[0]][openQuestion[1]].question}
							</div>
						</div>
					</div>
				)}
				<div className="home">
					<div className="points">
						{Object.entries(gameState.points).map(([team, points]) => (
							<div
								className={`points-team ${
									gameState.teamOnTurn == team ? 'onTurn' : ''
								}`}
							>
								TÝM {team}: ${points}
							</div>
						))}
					</div>
					<div className="grid-outer">
						<div
							className="grid"
							style={
								{ '--groups': GROUPS.length, '--rows': ROWS.length } as any
							}
						>
							<div className="groups">
								{GROUPS.map((group, i) => (
									<div className="group" style={{ '--group': i } as any}>
										<div className="cell-inner">{group}</div>
									</div>
								))}
							</div>
							{Object.entries(groupedQuestions).map(([group, column]) => (
								<div className="column">
									{Object.entries(column).map(([row, question]) =>
										this.renderQuestion(question)
									)}
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		)
	}
}

export default App
