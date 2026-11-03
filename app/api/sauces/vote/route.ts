import { recordVote } from '@/lib/vote'

export const POST = (request: Request) => recordVote(request, 'sauces')
