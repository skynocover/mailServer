import React from 'react';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/client';

export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  return { props: {} };
};

export default function Index({ data }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const [session, loading] = useSession();

  React.useEffect(() => {
    if (!loading && !session) {
      signIn();
    } else if (!loading && session) {
      router.push('/Home');
    }
  }, [loading, session]);
  return <div></div>;
}
