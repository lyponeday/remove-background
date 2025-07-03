import { UploadImage } from "@/components/upload-image"
import { getSession } from "@/lib/auth"

export default async function RemoveBackgroundPage() {
  const session = await getSession()

  return (
    <div className="container mx-auto px-4 py-12">
      <UploadImage user={session} />
    </div>
  )
}
