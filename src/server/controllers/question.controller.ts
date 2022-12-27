import { SetQuestionAnswerInput } from './../schema/question.schema';
import { simpleUserSelect } from '~/server/selectors/user.selector';
import { GetByIdInput } from '~/server/schema/base.schema';
import {
  getQuestions,
  getQuestionDetail,
  upsertQuestion,
  deleteQuestion,
  setQuestionAnswer,
} from './../services/question.service';
import { throwDbError, throwNotFoundError } from '~/server/utils/errorHandling';
import { GetQuestionsInput, UpsertQuestionInput } from '~/server/schema/question.schema';
import { Context } from '~/server/createContext';

export type GetQuestionsProps = AsyncReturnType<typeof getQuestionsHandler>;
export const getQuestionsHandler = async ({
  ctx,
  input,
}: {
  ctx: Context;
  input: GetQuestionsInput;
}) => {
  try {
    const { items, ...rest } = await getQuestions({
      ...input,
      select: {
        id: true,
        title: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
        rank: {
          select: {
            heartCountDay: true,
            answerCountDay: true,
          },
        },
        selectedAnswerId: true,
      },
    });

    return {
      ...rest,
      items: items.map(({ tags, ...item }) => ({
        ...item,
        tags: tags.map((x) => x.tag),
        rank: {
          heartCount: item.rank?.heartCountDay,
          answerCount: item.rank?.answerCountDay,
        },
      })),
    };
  } catch (error) {
    throw throwDbError(error);
  }
};

export type QuestionDetailProps = AsyncReturnType<typeof getQuestionDetailHandler>;
export const getQuestionDetailHandler = async ({
  ctx,
  input: { id },
}: {
  ctx: Context;
  input: GetByIdInput;
}) => {
  try {
    const userId = ctx.user?.id;
    const item = await getQuestionDetail({
      id,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        title: true,
        content: true,
        selectedAnswerId: true,
        user: { select: simpleUserSelect },
        tags: {
          select: {
            tag: {
              select: { id: true, name: true },
            },
          },
        },
        rank: {
          select: {
            heartCountAllTime: true,
          },
        },
        reactions: {
          where: { userId },
          take: !userId ? 0 : undefined,
          select: {
            id: true,
            userId: true,
            reaction: true,
          },
        },
      },
    });
    if (!item) throw throwNotFoundError();
    const { reactions, tags, ...question } = item;

    return {
      ...question,
      tags: tags.map((x) => x.tag),
      userReactions: reactions,
    };
  } catch (error) {
    throw throwDbError(error);
  }
};

export const upsertQuestionHandler = async ({
  ctx,
  input,
}: {
  ctx: DeepNonNullable<Context>;
  input: UpsertQuestionInput;
}) => {
  try {
    return await upsertQuestion({ ...input, userId: ctx.user.id });
  } catch (error) {
    throw throwDbError(error);
  }
};

export const deleteQuestionHandler = async ({
  ctx,
  input,
}: {
  ctx: DeepNonNullable<Context>;
  input: GetByIdInput;
}) => {
  try {
    await deleteQuestion(input);
  } catch (error) {
    throw throwDbError(error);
  }
};

export const setQuestionAnswerHandler = async ({
  ctx,
  input,
}: {
  ctx: DeepNonNullable<Context>;
  input: SetQuestionAnswerInput;
}) => {
  try {
    await setQuestionAnswer(input);
  } catch (error) {
    throw throwDbError(error);
  }
};
