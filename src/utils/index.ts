<<<<<<< HEAD



export function createPageUrl(pageName: string) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
=======
export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
>>>>>>> 9de21d4d2f6ac33c914ab8fc7c4a8a81454b6d63
}