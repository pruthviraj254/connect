let mainWebContentsId: number | null = null;

export function setMainWebContentsId(id: number): void {
  mainWebContentsId = id;
}

export function clearMainWebContentsId(): void {
  mainWebContentsId = null;
}

export function isMainWebContents(senderId: number): boolean {
  return mainWebContentsId !== null && senderId === mainWebContentsId;
}
