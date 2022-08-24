//
// RENDERER
//

class Renderer {
    
    constructor(fps, context) {
        this.fps = fps
        this.context = context
        this.isStop = false
    }

    setDraw(callback) {
        this.draw = callback
        return this
    }

    setInit(callback) {
        this.init = callback
        return this
    }

    start(showFPS = false) {
        if (this.init) this.init()

        this.frameCount = 0;
        this.fpsInterval = 1000 / this.fps;
        this.then = window.performance.now()
        this.startTime = this.then;

        this.render = () => {
            if (this.isStop) return

            requestAnimationFrame(this.render)

            this.now = window.performance.now();
            this.elapsed = this.now - this.then

            if (this.elapsed > this.fpsInterval) {
                this.then = this.now - (this.elapsed % this.fpsInterval)

                if (this.draw) this.draw(this.context)

                if (showFPS) {
                    const currentFPS = 1000 / ((this.now - this.startTime) / ++this.frameCount)
                    console.log(`fps: ${currentFPS.toFixed(2)}`)
                }
            }
        }
        requestAnimationFrame(this.render)
    }

    pause() {
        this.isStop = true
    }

    play() {
        this.isStop = false
        requestAnimationFrame(this.render)
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
        context.fillStyle = start.x === this.x && start.y === this.y ? 'orange' : colour
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

const _context = _canvas.getContext('2d')


//
// ALGO
//
let maze, current, next, previous, previousColour, stack, start

const resetVariables = () => {
    maze = Array.from({length: LINE_WISE_COUNT}, (_, i) => {
        return Array.from({length: LINE_WISE_COUNT}, (_, j) => {
            return new Cell(j, i)
        })
    }).flat()
    start = maze[Math.floor(Math.random() * maze.length)]
    current = start
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
// ENTRY POINT
//
new Renderer(24, _context)
    .setInit(() => resetVariables())
    .setDraw((context) => {
        if (stack.length === 0) {
            context.fillStyle = '#28282B'
            context.fillRect(0, 0, CORRECT_CANVAS_SIZE, CORRECT_CANVAS_SIZE)
        }
        recursiveBackTrack().next()
        if (previous) previous.render(context, previousColour)
        current.render(context, 'red')
    })
    .start()
