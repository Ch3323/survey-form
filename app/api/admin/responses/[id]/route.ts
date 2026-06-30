import {
  ApiError,
  jsonError,
  jsonOk,
  responseInclude,
  serialize,
} from "@/lib/api/survey";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);

    const { id } = await context.params;
    const response = await prisma.surveyResponse.findUnique({
      where: { id },
      include: responseInclude,
    });

    if (!response) {
      throw new ApiError(404, "Response not found");
    }

    return jsonOk({ response: serialize(response) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, context: Params) {
  try {
    await requireAdmin(request.headers);

    const { id } = await context.params;
    await prisma.surveyResponse.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    return jsonError(error);
  }
}
