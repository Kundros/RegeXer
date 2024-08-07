export function clearCanvas(context : CanvasRenderingContext2D, canvas : HTMLCanvasElement)
{
    const boundingRegex = canvas.getBoundingClientRect();

    context.clearRect(0, 0, boundingRegex.width, boundingRegex.height);
    canvas.width = boundingRegex.width;
    canvas.height = boundingRegex.height;
}