class Renderer {
    #FPS
    #loopLogic
    #canvas
    #context

    constructor(canvas, FPS) {
        this.#canvas = canvas
        this.#context = canvas.getContext('2d')
        this.#FPS = {
            FPS: FPS,
            cycleDelay: Math.floor(1000 / FPS),
            oldCycleTime: 0,
            cycleCount: 0,
            fpsRate: 'FPS: ...'
        }
        return this
    }

    #calculateFPS = () => {
        this.#FPS.cycleCount++
        if (this.#FPS.cycleCount >= 60) this.#FPS.cycleCount = 0
        let startTime = Date.now()
        let cycleTime = startTime - this.#FPS.oldCycleTime
        this.#FPS.oldCycleTime = startTime
        if (this.#FPS.cycleCount % 60 === 0) this.#FPS.fpsRate = `FPS: ${Math.floor(1000 / cycleTime)}`
    }

    setLoopLogic = (handler) => {
        this.#loopLogic = handler
        return this
    }

    init = (handler) => {
        handler(this.#canvas, this.#canvas)
        return this
    }

    run = (showFPS = false, clear = true) => {
        this.#calculateFPS()
        if (showFPS) console.log(this.#FPS.fpsRate)

        if (clear) {
            this.#context.fillStyle = 'white'
            this.#context.fillRect(0, 0, this.#canvas.width, this.#canvas.height)
        }

        this.#loopLogic(this.#canvas, this.#context)

        setTimeout(this.run, this.#FPS.cycleDelay, showFPS, clear)
    }
}

class Cell {

    constructor(x, y) {
        this.x = x // col
        this.y = y // row
        this.walls = [true, true, true, true] // top, right, bottom, left
        this.visited = false
    }

    static #getIndex = (x, y) => {
        if (x < 0 || y < 0 || x > LINE_WISE_COUNT - 1 || y > LINE_WISE_COUNT - 1) return -1
        return LINE_WISE_COUNT * y + x
    }

    getUnvisitedNeighbour = () => {
        const unvisitedNeighbours = [
            maze[Cell.#getIndex(this.x, this.y - 1)],
            maze[Cell.#getIndex(this.x + 1, this.y)],
            maze[Cell.#getIndex(this.x, this.y + 1)],
            maze[Cell.#getIndex(this.x - 1, this.y)]
        ].filter(cell => cell && !cell.visited)

        if (unvisitedNeighbours.length > 0) return unvisitedNeighbours[Math.floor(Math.random() * unvisitedNeighbours.length)]
        return undefined
    }

    removeWalls = (other) => {
        if (this.x < other.x) {
            this.walls[1] = false
            other.walls[3] = false
        } else if (this.x > other.x) {
            this.walls[3] = false
            other.walls[1] = false
        }

        if (this.y < other.y) {
            this.walls[2] = false
            other.walls[0] = false
        } else if (this.y > other.y) {
            this.walls[0] = false
            other.walls[2] = false
        }
    }

    render = (context, colour) => {
        // top left
        context.fillStyle = colour
        context.fillRect(
            (2 * this.x + 1) * RENDERED_CELL_SIZE,
            (2 * this.y + 1) * RENDERED_CELL_SIZE,
            RENDERED_CELL_SIZE, RENDERED_CELL_SIZE)

        // top right
        context.fillStyle = this.walls[1] ? '#28282B' : colour
        context.fillRect(
            (2 * (this.x + 1)) * RENDERED_CELL_SIZE,
            (2 * this.y + 1) * RENDERED_CELL_SIZE,
            RENDERED_CELL_SIZE, RENDERED_CELL_SIZE)

        // bottom left
        context.fillStyle = this.walls[2] ? '#28282B' : colour
        context.fillRect(
            (2 * this.x + 1) * RENDERED_CELL_SIZE,
            (2 * (this.y + 1)) * RENDERED_CELL_SIZE,
            RENDERED_CELL_SIZE, RENDERED_CELL_SIZE)

        // bottom right
        context.fillStyle = '#28282B'
        context.fillRect(
            (2 * (this.x + 1)) * RENDERED_CELL_SIZE,
            (2 * (this.y + 1)) * RENDERED_CELL_SIZE,
            RENDERED_CELL_SIZE, RENDERED_CELL_SIZE)
    }
}


//
// SIZE CONSTANTS
//
const CANVAS_SIZE = 800
// number of internal cells as block-wise
let BLOCK_WISE_COUNT = 55
// number of cells as line-wise
let LINE_WISE_COUNT = (BLOCK_WISE_COUNT + 1) / 2

let RENDERED_CELL_SIZE = Math.round(CANVAS_SIZE / (BLOCK_WISE_COUNT + 2))
// recalculating canvas size using floored cell size, so the canvas can be centered correctly
let CORRECT_CANVAS_SIZE = RENDERED_CELL_SIZE * (BLOCK_WISE_COUNT + 2)


//
// CANVAS
//
const _canvas = document.getElementById('canvas')
_canvas.setAttribute('width', CORRECT_CANVAS_SIZE + '')
_canvas.setAttribute('height', CORRECT_CANVAS_SIZE + '')


//
// ALGO
//
let maze, current, next, previous, previousColour, stack

const resetVariables = () => {
    maze = Array.from({length: LINE_WISE_COUNT}, (_, i) => {
        return Array.from({length: LINE_WISE_COUNT}, (_, j) => {
            return new Cell(j, i)
        })
    }).flat()
    current = maze[0]
    current.visited = true
    next = current.getUnvisitedNeighbour()
    previous = null
    stack = []
}

function* recursiveBackTrack() {
    if (next) {
        stack.push(current)
        current.removeWalls(next)
        previous = current
        current = next
        current.visited = true
        next = current.getUnvisitedNeighbour()
        previousColour = 'slategrey'
        yield
    } else if (stack.length > 0) {
        previous = current
        current = stack.pop()
        next = current.getUnvisitedNeighbour()
        previousColour = 'white'
        yield
    }

    resetVariables()
}


//
// CHANGE COLUMNS
//
// TODO: style the canvas so that it has a variable border dependant on its width and height
//       - so canvas element has fixed width and height but render space can change
//       -
const columnsRange = document.getElementById('column-range')
columnsRange.value = BLOCK_WISE_COUNT
columnsRange.onchange = () => {
    BLOCK_WISE_COUNT = columnsRange.value * 2 + 1
    LINE_WISE_COUNT = (BLOCK_WISE_COUNT + 1) / 2

    RENDERED_CELL_SIZE = Math.round(CANVAS_SIZE / (BLOCK_WISE_COUNT + 2))
    CORRECT_CANVAS_SIZE = RENDERED_CELL_SIZE * (BLOCK_WISE_COUNT + 2)

    _canvas.setAttribute('width', CORRECT_CANVAS_SIZE + '')
    _canvas.setAttribute('height', CORRECT_CANVAS_SIZE + '')

    resetVariables()
}


//
// ENTRY POINT
//
new Renderer(_canvas, 24)
    .init(() => resetVariables())
    .setLoopLogic((canvas, context) => {
        if (stack.length === 0) {
            context.fillStyle = '#28282B'
            context.fillRect(0, 0, CORRECT_CANVAS_SIZE, CORRECT_CANVAS_SIZE)
        }
        recursiveBackTrack().next()

        if (previous) previous.render(context, previousColour)
        current.render(context, 'red')
    }).run(false, false)