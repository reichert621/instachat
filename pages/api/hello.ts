import type {NextApiRequest, NextApiResponse} from 'next';

type ResponseData = {data: any} | {status: number; error: string | null};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) => {
  return res.status(200).json({
    data: 'Hello world!',
  });
};

export default handler;
