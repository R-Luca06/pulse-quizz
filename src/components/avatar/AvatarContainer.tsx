import AvatarDisplay from './AvatarDisplay'

interface Props {
  className?: string
  fontSize?: string
}

export default function AvatarContainer({ className, fontSize }: Props) {
  return <AvatarDisplay className={className} fontSize={fontSize} />
}
