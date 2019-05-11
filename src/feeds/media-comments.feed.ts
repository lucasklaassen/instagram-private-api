import { Expose } from 'class-transformer';
import { Feed } from '../core/feed';
import { MediaCommentsFeedResponse, MediaCommentsFeedResponseCommentsItem } from '../responses/';

export class MediaCommentsFeed extends Feed<MediaCommentsFeedResponse, MediaCommentsFeedResponseCommentsItem> {
  id: string;
  moreAvailable = true;
  comments = [];
  @Expose()
  private nextMaxId: string;

  set state(body: MediaCommentsFeedResponse) {
    this.moreAvailable = !!body.next_max_id;
    this.nextMaxId = body.next_max_id;
  }

  async request() {
    const { body } = await this.client.request.send<MediaCommentsFeedResponse>({
      url: `/api/v1/media/${this.id}/comments/`,
      qs: {
        can_support_threading: true,
        max_id: this.nextMaxId,
      },
    });
    this.state = body;
    return body;
  }

  async items() {
    const response = await this.request();
    return response.comments;
  }

  async fetchAllComments(): Promise<any> {
    return new Promise(resolve => {
      this.fetchBatchOfComments(() => {
        resolve(this.comments);
      });
    });
  }

  async fetchBatchOfComments(callback) {
    this.items().then(fetchedComments => {
      this.comments = this.comments.concat(fetchedComments);
      setTimeout(() => {
        if (this.moreAvailable) {
          this.fetchBatchOfComments(callback);
        } else {
          callback();
        }
      }, 3000);
    });
  }
}
